"""Unified CLI for database export and repopulate operations."""

import contextlib
import os
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime
from pathlib import Path

import typer

from .export_data import (
    download_from_gcs,
    export_database,
    export_schema_only,
    upload_to_gcs,
)
from .repopulate_data import (
    _is_custom_format_dump,
    drop_all_tables,
    get_pg_connection_params,
    restore_database,
    validate_dump_file,
)

app = typer.Typer(
    help="Database backup and restoration utilities for Scaffold",
    no_args_is_help=True,
)

# Add export subcommands
export_app = typer.Typer(help="Database export operations using pg_dump")
app.add_typer(export_app, name="export")

# Add repopulate subcommands
restore_app = typer.Typer(help="Database restoration operations using pg_restore")
app.add_typer(restore_app, name="restore")


@export_app.command("full")
def export_full(
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
    exclude_tables: str = typer.Option(
        "",
        "--exclude-tables",
        help="Comma-separated list of tables to exclude",
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Enable verbose output",
    ),
    upload_gcs: bool = typer.Option(
        False,
        "--upload-gcs",
        help="Upload backup to GCS after successful export",
    ),
    gcs_prefix: str = typer.Option(
        "",
        "--gcs-prefix",
        help="GCS path prefix (e.g., 'backups/prod')",
    ),
    gcs_bucket: str = typer.Option(
        "",
        "--gcs-bucket",
        help="GCS bucket name for backup storage (overrides default)",
    ),
) -> None:
    """Export the entire database using pg_dump."""

    # Validate GCS upload options
    if upload_gcs and not gcs_bucket:
        typer.echo("❌ --upload-gcs requires --gcs-bucket", err=True)
        sys.exit(1)

    # Create output directory
    output_path_obj = Path(output_dir)
    output_path_obj.mkdir(parents=True, exist_ok=True)

    # Generate filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"db_export_{timestamp}.{'dump' if compress else 'sql'}"
    full_output_path = output_path_obj / filename

    # Parse exclude tables
    exclude_list = None
    if exclude_tables:
        exclude_list = [t.strip() for t in exclude_tables.split(",")]

    # Perform export
    success = export_database(
        output_path=full_output_path,
        compress=compress,
        verbose=verbose,
        exclude_tables=exclude_list,
    )

    if success:
        typer.echo(f"✅ Database export completed: {full_output_path}")
        typer.echo(f"📊 File size: {full_output_path.stat().st_size:,} bytes")

        # Upload to GCS if requested
        if upload_gcs:
            gcs_path = f"{gcs_prefix}/{filename}" if gcs_prefix else filename
            bucket_name = gcs_bucket if gcs_bucket else None
            upload_success = upload_to_gcs(full_output_path, gcs_path, bucket_name)

            if upload_success:
                bucket_display = f" (bucket: {bucket_name})" if bucket_name else ""
                typer.echo(f"☁️  Backup uploaded to GCS: {gcs_path}{bucket_display}")
            else:
                typer.echo("❌ Failed to upload backup to GCS", err=True)
                sys.exit(1)
    else:
        typer.echo("❌ Database export failed", err=True)
        sys.exit(1)


@export_app.command("schema")
def export_schema_cmd(
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
    full_output_path = output_path_obj / filename

    success = export_schema_only(output_path=full_output_path, verbose=verbose)

    if success:
        typer.echo(f"✅ Schema export completed: {full_output_path}")
    else:
        typer.echo("❌ Schema export failed", err=True)
        sys.exit(1)


@export_app.command("check")
def export_check() -> None:
    """Check if pg_dump is available and database connection works."""

    # Check pg_dump availability
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
            "❌ pg_dump not found. Please install PostgreSQL client tools.", err=True
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


@restore_app.command("from-file")
def restore_from_file(
    dump_path: str = typer.Argument(
        ...,
        help="Path to the database dump file (local path or gs://bucket/path)",
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
    """Restore database from a pg_dump file (local or GCS)."""

    # Validate mutually exclusive options
    if data_only and schema_only:
        typer.echo("❌ --data-only and --schema-only cannot be used together", err=True)
        sys.exit(1)

    # Handle GCS download if needed
    if dump_path.startswith("gs://"):
        temp_dir = Path(tempfile.mkdtemp())
        filename = dump_path.split("/")[-1]
        local_dump_path = temp_dir / filename
        temp_file = local_dump_path

        typer.echo(f"📥 Downloading from GCS: {dump_path}")
        download_success = download_from_gcs(dump_path, local_dump_path)

        if not download_success:
            typer.echo("❌ Failed to download backup from GCS", err=True)
            sys.exit(1)

        dump_path_obj = local_dump_path
        typer.echo(f"✅ Downloaded to: {dump_path_obj}")
    else:
        dump_path_obj = Path(dump_path)
        temp_file = None

    # Validate dump file
    if not validate_dump_file(dump_path_obj):
        typer.echo("❌ Invalid dump file", err=True)
        sys.exit(1)

    # Check compatibility with plain SQL files
    is_custom_format = _is_custom_format_dump(dump_path_obj)
    if not is_custom_format and (data_only or schema_only or clean):
        typer.echo(
            "❌ --data-only, --schema-only, and --clean options are only supported with custom format dumps",
            err=True,
        )
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

    # Clean up temporary file if we downloaded from GCS
    try:
        if temp_file and temp_file.exists():
            shutil.rmtree(temp_file.parent)
            typer.echo("🧹 Cleaned up temporary files")
    except Exception:
        # Don't fail the restore if cleanup fails
        pass

    if success:
        typer.echo(f"✅ Database restore completed from: {dump_path}")
    else:
        typer.echo("❌ Database restore failed", err=True)
        sys.exit(1)


@restore_app.command("validate")
def validate_dump(
    dump_path: str = typer.Argument(
        ...,
        help="Path to the database dump file (local path or gs://bucket/path)",
    ),
) -> None:
    """Validate a database dump file (local or GCS)."""

    # Handle GCS download if needed
    if dump_path.startswith("gs://"):
        temp_dir = Path(tempfile.mkdtemp())
        filename = dump_path.split("/")[-1]
        local_dump_path = temp_dir / filename
        temp_file = local_dump_path

        typer.echo(f"📥 Downloading from GCS for validation: {dump_path}")
        download_success = download_from_gcs(dump_path, local_dump_path)

        if not download_success:
            typer.echo("❌ Failed to download backup from GCS", err=True)
            sys.exit(1)

        dump_path_obj = local_dump_path
    else:
        dump_path_obj = Path(dump_path)
        temp_file = None

    if validate_dump_file(dump_path_obj):
        is_custom = _is_custom_format_dump(dump_path_obj)
        format_type = "Custom (binary)" if is_custom else "Plain SQL"
        size_mb = dump_path_obj.stat().st_size / (1024 * 1024)

        typer.echo(f"✅ Valid dump file: {dump_path}")
        typer.echo(f"📋 Format: {format_type}")
        typer.echo(f"📊 Size: {size_mb:.2f} MB")
    else:
        typer.echo("❌ Invalid dump file", err=True)
        if temp_file:
            with contextlib.suppress(Exception):
                shutil.rmtree(temp_file.parent)
        sys.exit(1)

    # Clean up temporary file if we downloaded from GCS
    if temp_file and temp_file.exists():
        try:
            shutil.rmtree(temp_file.parent)
            typer.echo("🧹 Cleaned up temporary files")
        except Exception:
            pass


@restore_app.command("clean-db")
def clean_database(
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


@restore_app.command("check")
def restore_check() -> None:
    """Check if pg_restore/psql are available and database connection works."""

    # Check tools availability
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


@app.command("info")
def show_info() -> None:
    """Show information about the database backup/restore system."""
    typer.echo("🗄️  Scaffold Database Backup & Restore System")
    typer.echo("")
    typer.echo("This system uses PostgreSQL's native pg_dump and pg_restore tools")
    typer.echo("for maximum efficiency with large databases containing binary data.")
    typer.echo("")
    typer.echo("Key features:")
    typer.echo("• Binary compression for minimal storage footprint")
    typer.echo("• Parallel processing support via pg_dump/pg_restore")
    typer.echo("• Selective table export/import")
    typer.echo("• Transaction-safe restoration")
    typer.echo("• Cloud-ready with Kubernetes integration")
    typer.echo("")
    typer.echo("Usage examples:")
    typer.echo("  Export: python -m app.db.setup.cli export full --compress")
    typer.echo("  Import: python -m app.db.setup.cli restore from-file backup.dump")
    typer.echo("")
    typer.echo(
        "For cloud deployments, see docs/adr-001-database-backup-restore-strategy.md"
    )


if __name__ == "__main__":
    app()
