"""Database export functionality using pg_dump for efficient binary backups."""

import os
import subprocess
import sys
from datetime import datetime
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


def export_database(
    output_path: Path,
    compress: bool = True,
    verbose: bool = False,
    exclude_tables: list[str] | None = None,
) -> bool:
    """
    Export database using pg_dump for maximum efficiency.

    Args:
        output_path: Path where the dump file will be saved
        compress: Whether to compress the output (default: True)
        verbose: Enable verbose output
        exclude_tables: List of table names to exclude from export

    Returns:
        True if export was successful, False otherwise
    """
    try:
        # Prepare environment variables for pg_dump
        env = os.environ.copy()
        env.update(get_pg_connection_params())

        # Build pg_dump command
        cmd = ["pg_dump"]

        if compress:
            cmd.extend(["--format=custom", "--compress=9"])
        else:
            cmd.extend(["--format=plain"])

        if verbose:
            cmd.append("--verbose")

        # Add exclude tables if specified
        if exclude_tables:
            for table in exclude_tables:
                cmd.extend([f"--exclude-table={table}"])

        # Add output file
        cmd.extend([f"--file={output_path}"])

        # Add database name
        cmd.append(env["PGDATABASE"])

        logger.info(
            "Starting database export",
            output_path=str(output_path),
            compress=compress,
            exclude_tables=exclude_tables,
        )

        # Execute pg_dump
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )

        if result.returncode != 0:
            logger.error(
                "Database export failed",
                error=result.stderr,
                returncode=result.returncode,
            )
            return False

        if verbose and result.stdout:
            print(result.stdout)

        logger.info(
            "Database export completed successfully",
            output_path=str(output_path),
            size_bytes=output_path.stat().st_size,
        )

        return True

    except Exception as e:
        logger.error("Database export failed with exception", error=str(e))
        return False


def export_schema_only(output_path: Path, verbose: bool = False) -> bool:
    """
    Export database schema only (no data) using pg_dump.

    Args:
        output_path: Path where the schema dump will be saved
        verbose: Enable verbose output

    Returns:
        True if export was successful, False otherwise
    """
    try:
        env = os.environ.copy()
        env.update(get_pg_connection_params())

        cmd = [
            "pg_dump",
            "--schema-only",
            "--format=plain",
            f"--file={output_path}",
        ]

        if verbose:
            cmd.append("--verbose")

        cmd.append(env["PGDATABASE"])

        logger.info("Exporting database schema", output_path=str(output_path))

        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )

        if result.returncode != 0:
            logger.error("Schema export failed", error=result.stderr)
            return False

        logger.info("Schema export completed successfully")
        return True

    except Exception as e:
        logger.error("Schema export failed with exception", error=str(e))
        return False


def upload_to_gcs(
    local_path: Path, gcs_path: str, bucket_name: str | None = None
) -> bool:
    """
    Upload a backup file to Google Cloud Storage using existing infrastructure.

    Args:
        local_path: Local file path to upload
        gcs_path: Destination path in GCS bucket (e.g., "backups/prod/db_export_20231215.dump")
        bucket_name: Optional bucket name override, defaults to user files bucket

    Returns:
        True if upload was successful, False otherwise
    """
    try:
        from app.dependencies.storage_deps import get_sync_gcs_client

        if not bucket_name:
            raise ValueError("Bucket name must be specified")
        # Use specific backup bucket
        client = get_sync_gcs_client()
        bucket = client.bucket(bucket_name)

        blob = bucket.blob(gcs_path)

        logger.info(
            "backup_upload_started",
            local_path=str(local_path),
            bucket=bucket.name,
            gcs_path=gcs_path,
        )

        blob.upload_from_filename(str(local_path))

        logger.info(
            "backup_upload_completed",
            bucket=bucket.name,
            gcs_path=gcs_path,
            size_bytes=local_path.stat().st_size,
        )

        return True

    except Exception as e:
        logger.error("backup_upload_failed", error=str(e))
        return False


def download_from_gcs(
    gcs_path: str, local_path: Path, bucket_name: str | None = None
) -> bool:
    """
    Download a backup file from Google Cloud Storage.

    Args:
        gcs_path: GCS path (e.g., "database/db_export_20231215.dump" or "gs://bucket/path")
        local_path: Local destination path
        bucket_name: Optional bucket name override, defaults to user files bucket

    Returns:
        True if download was successful, False otherwise
    """
    try:
        from app.dependencies.storage_deps import get_sync_gcs_client

        # Handle full GCS URL format
        if gcs_path.startswith("gs://"):
            # Extract bucket and path from full URL
            parts = gcs_path.replace("gs://", "").split("/", 1)
            if len(parts) != 2:
                logger.error("gcs_download_invalid_path", gcs_path=gcs_path)
                return False
            bucket_name = parts[0]
            blob_path = parts[1]
        else:
            # Use provided bucket_name with relative path
            if not bucket_name:
                logger.error("gcs_download_missing_bucket", gcs_path=gcs_path)
                return False
            blob_path = gcs_path

        if not bucket_name:
            raise ValueError("Bucket name must be specified")
        # Use specific backup bucket
        client = get_sync_gcs_client()
        bucket = client.bucket(bucket_name)

        blob = bucket.blob(blob_path)

        logger.info(
            "gcs_download_started",
            gcs_path=gcs_path,
            bucket=bucket.name,
            local_path=str(local_path),
        )

        # Create parent directories if they don't exist
        local_path.parent.mkdir(parents=True, exist_ok=True)

        blob.download_to_filename(str(local_path))

        logger.info(
            "gcs_download_completed",
            bucket=bucket.name,
            blob_path=blob_path,
            local_path=str(local_path),
            size_bytes=local_path.stat().st_size,
        )

        return True

    except Exception as e:
        logger.error("gcs_download_failed", error=str(e))
        return False


# Create the Typer app at module level
app = typer.Typer(help="Database export utilities using pg_dump")


@app.command()
def export(
    output_dir: str = typer.Option(
        "./db_backup",
        "--output-dir",
        "-o",
        help="Directory to save the database export",
    ),
    compress: bool = typer.Option(
        True,
        "--compress/--no-compress",
        help="Compress the output (custom format)",
    ),
    exclude_tables: str | None = typer.Option(
        None,
        "--exclude-tables",
        help="Comma-separated list of tables to exclude",
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Enable verbose output",
    ),
) -> None:
    """Export the entire database using pg_dump."""
    # Create output directory
    output_path_obj = Path(output_dir)
    output_path_obj.mkdir(parents=True, exist_ok=True)

    # Generate filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if compress:
        filename = f"db_export_{timestamp}.dump"
    else:
        filename = f"db_export_{timestamp}.sql"

    output_path = output_path_obj / filename

    # Parse exclude tables if provided
    exclude_list = None
    if exclude_tables:
        exclude_list = [t.strip() for t in exclude_tables.split(",")]

    # Perform export
    success = export_database(
        output_path=output_path,
        compress=compress,
        verbose=verbose,
        exclude_tables=exclude_list,
    )

    if success:
        typer.echo(f"✅ Database export completed: {output_path}")
        typer.echo(f"📊 File size: {output_path.stat().st_size:,} bytes")
    else:
        typer.echo("❌ Database export failed", err=True)
        sys.exit(1)


@app.command()
def schema(
    output_dir: str = typer.Option(
        "./db_backup",
        "--output-dir",
        "-o",
        help="Directory to save the schema export",
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Enable verbose output",
    ),
) -> None:
    """Export database schema only (no data)."""
    output_path_obj = Path(output_dir)
    output_path_obj.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"db_schema_{timestamp}.sql"
    output_path = output_path_obj / filename

    success = export_schema_only(output_path=output_path, verbose=verbose)

    if success:
        typer.echo(f"✅ Schema export completed: {output_path}")
    else:
        typer.echo("❌ Schema export failed", err=True)
        sys.exit(1)


@app.command()
def check() -> None:
    """Check if pg_dump is available and database connection works."""
    # Check if pg_dump is available
    try:
        result = subprocess.run(
            ["pg_dump", "--version"],
            capture_output=True,
            text=True,
            check=True,
        )
        typer.echo(f"✅ pg_dump available: {result.stdout.strip()}")
    except (subprocess.CalledProcessError, FileNotFoundError):
        typer.echo(
            "❌ pg_dump not found. Please install PostgreSQL client tools.",
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
    """CLI entry point for database export."""
    app()


if __name__ == "__main__":
    main()
