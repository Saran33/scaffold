"""Database repopulate functionality using pg_restore for efficient restoration."""

import os
import subprocess
import sys
from pathlib import Path

import structlog
import typer

from app.core.config import settings

logger = structlog.stdlib.get_logger()


def get_pg_connection_params() -> dict[str, str]:
    """Get PostgreSQL connection parameters from settings."""
    db_url = settings.DB_URI_SYNC
    if not db_url:
        raise ValueError("DB_URI_SYNC must be set in the environment")

    if not db_url.database:
        raise ValueError("DB_URI_SYNC must include a database name")
    if not db_url.host:
        raise ValueError("DB_URI_SYNC must include a host")
    if not db_url.username:
        raise ValueError("DB_URI_SYNC must include a username")

    return {
        "PGHOST": str(db_url.host),
        "PGPORT": str(db_url.port or 5432),
        "PGDATABASE": str(db_url.database),
        "PGUSER": str(db_url.username),
        "PGPASSWORD": str(db_url.password or ""),
    }


def restore_database(
    dump_path: Path,
    clean: bool = False,
    data_only: bool = False,
    schema_only: bool = False,
    verbose: bool = False,
    single_transaction: bool = True,
) -> bool:
    """
    Restore database using pg_restore for maximum efficiency.

    Args:
        dump_path: Path to the dump file to restore
        clean: Drop database objects before recreating them
        data_only: Restore only data, not schema
        schema_only: Restore only schema, not data
        verbose: Enable verbose output
        single_transaction: Execute restore in a single transaction

    Returns:
        True if restore was successful, False otherwise
    """
    try:
        # Prepare environment variables for pg_restore
        env = os.environ.copy()
        env.update(get_pg_connection_params())

        # Determine if this is a custom format dump or SQL file
        is_custom_format = _is_custom_format_dump(dump_path)

        if is_custom_format:
            # Use pg_restore for custom format
            cmd = ["pg_restore"]

            if clean:
                cmd.append("--clean")
            if data_only:
                cmd.append("--data-only")
            if schema_only:
                cmd.append("--schema-only")
            if verbose:
                cmd.append("--verbose")
            if single_transaction:
                cmd.append("--single-transaction")

            # Connection parameters
            cmd.extend(
                [
                    f"--host={env['PGHOST']}",
                    f"--port={env['PGPORT']}",
                    f"--username={env['PGUSER']}",
                    f"--dbname={env['PGDATABASE']}",
                ]
            )

            # Input file
            cmd.append(str(dump_path))

        else:
            # Use psql for plain SQL files
            cmd = ["psql"]

            if verbose:
                cmd.append("--echo-all")
            if single_transaction:
                cmd.append("--single-transaction")

            cmd.extend(
                [
                    f"--host={env['PGHOST']}",
                    f"--port={env['PGPORT']}",
                    f"--username={env['PGUSER']}",
                    f"--dbname={env['PGDATABASE']}",
                    f"--file={dump_path}",
                ]
            )

        logger.info(
            "Starting database restore",
            dump_path=str(dump_path),
            is_custom_format=is_custom_format,
            clean=clean,
            data_only=data_only,
            schema_only=schema_only,
        )

        # Execute restore command
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )

        if result.returncode != 0:
            logger.error(
                "Database restore failed",
                error=result.stderr,
                returncode=result.returncode,
            )
            return False

        if verbose and result.stdout:
            print(result.stdout)

        logger.info("Database restore completed successfully")
        return True

    except Exception as e:
        logger.error("Database restore failed with exception", error=str(e))
        return False


def _is_custom_format_dump(dump_path: Path) -> bool:
    """
    Check if dump file is in PostgreSQL custom format.

    Custom format files start with "PGDMP" signature.
    """
    try:
        with open(dump_path, "rb") as f:
            header = f.read(5)
            return header == b"PGDMP"
    except Exception:
        return False


def validate_dump_file(dump_path: Path) -> bool:
    """
    Validate that the dump file exists and is readable.

    Args:
        dump_path: Path to the dump file

    Returns:
        True if file is valid, False otherwise
    """
    if not dump_path.exists():
        logger.error("Dump file does not exist", path=str(dump_path))
        return False

    if not dump_path.is_file():
        logger.error("Dump path is not a file", path=str(dump_path))
        return False

    if dump_path.stat().st_size == 0:
        logger.error("Dump file is empty", path=str(dump_path))
        return False

    # Try to read the beginning of the file
    try:
        with open(dump_path, "rb") as f:
            header = f.read(100)
            if len(header) == 0:
                logger.error("Cannot read dump file", path=str(dump_path))
                return False
    except Exception as e:
        logger.error("Error reading dump file", path=str(dump_path), error=str(e))
        return False

    logger.info(
        "Dump file validation successful",
        path=str(dump_path),
        size_bytes=dump_path.stat().st_size,
        is_custom_format=_is_custom_format_dump(dump_path),
    )
    return True


def drop_all_tables(confirm: bool = False) -> bool:
    """
    Drop all tables in the database (dangerous operation).

    Args:
        confirm: Whether the user has confirmed this destructive operation

    Returns:
        True if successful, False otherwise
    """
    if not confirm:
        logger.warning("Drop tables operation requires confirmation")
        return False

    try:
        env = os.environ.copy()
        env.update(get_pg_connection_params())

        # SQL to drop all tables
        drop_sql = """
        DO $$ DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END $$;
        """

        cmd = [
            "psql",
            f"--host={env['PGHOST']}",
            f"--port={env['PGPORT']}",
            f"--username={env['PGUSER']}",
            f"--dbname={env['PGDATABASE']}",
            "--command",
            drop_sql,
        ]

        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )

        if result.returncode != 0:
            logger.error("Failed to drop tables", error=result.stderr)
            return False

        logger.info("All tables dropped successfully")
        return True

    except Exception as e:
        logger.error("Error dropping tables", error=str(e))
        return False


# Create the Typer app at module level
app = typer.Typer(help="Database restoration utilities using pg_restore/psql")


@app.command()
def restore(
    dump_path: str = typer.Argument(
        ...,
        help="Path to the database dump file",
    ),
    clean: bool = typer.Option(
        False,
        "--clean",
        help="Drop database objects before recreating them",
    ),
    data_only: bool = typer.Option(
        False,
        "--data-only",
        help="Restore only data, not schema",
    ),
    schema_only: bool = typer.Option(
        False,
        "--schema-only",
        help="Restore only schema, not data",
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Enable verbose output",
    ),
    single_transaction: bool = typer.Option(
        True,
        "--single-transaction/--no-single-transaction",
        help="Execute restore in a single transaction (safer)",
    ),
    force: bool = typer.Option(
        False,
        "--force",
        help="Skip confirmation prompts",
    ),
) -> None:
    """Restore database from a pg_dump file."""
    # Validate dump file
    dump_path_obj = Path(dump_path)
    if not validate_dump_file(dump_path_obj):
        typer.echo("❌ Invalid dump file", err=True)
        sys.exit(1)

    # Confirmation prompt for destructive operations
    if (
        not force
        and (clean or not schema_only)
        and not typer.confirm(
            f"⚠️  This will modify the database. Continue with restore from {dump_path}?"
        )
    ):
        typer.echo("Operation cancelled.")
        sys.exit(0)

    # Perform restore
    success = restore_database(
        dump_path=dump_path_obj,
        clean=clean,
        data_only=data_only,
        schema_only=schema_only,
        verbose=verbose,
        single_transaction=single_transaction,
    )

    if success:
        typer.echo(f"✅ Database restore completed from: {dump_path}")
    else:
        typer.echo("❌ Database restore failed", err=True)
        sys.exit(1)


@app.command()
def validate(
    dump_path: str = typer.Argument(
        ...,
        help="Path to the database dump file",
    ),
) -> None:
    """Validate a database dump file."""
    dump_path_obj = Path(dump_path)
    if validate_dump_file(dump_path_obj):
        is_custom = _is_custom_format_dump(dump_path_obj)
        format_type = "Custom (binary)" if is_custom else "Plain SQL"
        size_mb = dump_path_obj.stat().st_size / (1024 * 1024)

        typer.echo(f"✅ Valid dump file: {dump_path}")
        typer.echo(f"📋 Format: {format_type}")
        typer.echo(f"📊 Size: {size_mb:.2f} MB")
    else:
        typer.echo("❌ Invalid dump file", err=True)
        sys.exit(1)


@app.command()
def clean_db(
    force: bool = typer.Option(
        False,
        "--force",
        help="Skip confirmation prompts",
    ),
) -> None:
    """Drop all tables in the database (DANGEROUS!)."""
    if not force:
        typer.echo("⚠️  WARNING: This will DROP ALL TABLES in the database!")
        if not typer.confirm("Are you absolutely sure you want to continue?"):
            typer.echo("Operation cancelled.")
            sys.exit(0)

    success = drop_all_tables(confirm=True)

    if success:
        typer.echo("✅ All tables dropped successfully")
    else:
        typer.echo("❌ Failed to drop tables", err=True)
        sys.exit(1)


@app.command()
def check() -> None:
    """Check if pg_restore/psql are available and database connection works."""
    # Check if tools are available
    tools = ["pg_restore", "psql"]
    for tool in tools:
        try:
            result = subprocess.run(
                [tool, "--version"],
                capture_output=True,
                text=True,
                check=True,
            )
            typer.echo(f"✅ {tool} available: {result.stdout.strip().split('\\n')[0]}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            typer.echo(
                f"❌ {tool} not found. Please install PostgreSQL client tools.",
                err=True,
            )
            sys.exit(1)

    # Check database connection
    try:
        env = os.environ.copy()
        env.update(get_pg_connection_params())

        result = subprocess.run(
            ["psql", "-c", "SELECT 1;"],
            env=env,
            capture_output=True,
            text=True,
            check=True,
        )
        typer.echo("✅ Database connection successful")
    except subprocess.CalledProcessError as e:
        typer.echo(f"❌ Database connection failed: {e.stderr}", err=True)
        sys.exit(1)


def main() -> None:
    """CLI entry point for database restoration."""
    app()


if __name__ == "__main__":
    main()
