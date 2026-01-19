"""Tests for database backup/restore CLI functionality."""

import subprocess
from datetime import datetime as dt
from pathlib import Path

from typer.testing import CliRunner

import app.db.setup.cli as cli

runner = CliRunner()


class FakeDatetimeModule:
    """Mock datetime for deterministic filename generation."""

    class datetime:
        @classmethod
        def now(cls):
            # 2024-01-02 03:04:05 -> filename timestamp "20240102_030405"
            return dt(2024, 1, 2, 3, 4, 5)


def test_cli_export_full_success(tmp_path: Path, monkeypatch):
    """Test CLI export full command with successful execution."""
    # Fix datetime for deterministic filename
    monkeypatch.setattr(cli, "datetime", FakeDatetimeModule.datetime)

    created = []

    def fake_export_database(
        output_path: Path, compress: bool, verbose: bool, exclude_tables
    ):
        # Simulate pg_dump having produced the file so stat().st_size works
        output_path.write_bytes(b"data")
        created.append(output_path)
        return True

    monkeypatch.setattr(cli, "export_database", fake_export_database)

    result = runner.invoke(
        cli.app, ["export", "full", "--output-dir", str(tmp_path), "--no-compress"]
    )

    assert result.exit_code == 0, result.stdout

    # Filename derived from fixed datetime with .sql extension because --no-compress
    expected = tmp_path / "db_export_20240102_030405.sql"
    assert expected.exists()
    assert "Database export completed" in result.stdout
    assert "File size:" in result.stdout


def test_cli_export_full_compressed(tmp_path: Path, monkeypatch):
    """Test CLI export full command with compression enabled."""
    monkeypatch.setattr(cli, "datetime", FakeDatetimeModule.datetime)

    def fake_export_database(
        output_path: Path, compress: bool, verbose: bool, exclude_tables
    ):
        assert compress is True
        output_path.write_bytes(b"compressed_data")
        return True

    monkeypatch.setattr(cli, "export_database", fake_export_database)

    result = runner.invoke(
        cli.app, ["export", "full", "--output-dir", str(tmp_path), "--compress"]
    )

    assert result.exit_code == 0
    expected = tmp_path / "db_export_20240102_030405.dump"
    assert expected.exists()


def test_cli_export_full_with_exclusions(tmp_path: Path, monkeypatch):
    """Test CLI export with table exclusions."""
    monkeypatch.setattr(cli, "datetime", FakeDatetimeModule.datetime)

    captured_args = {}

    def fake_export_database(
        output_path: Path, compress: bool, verbose: bool, exclude_tables
    ):
        captured_args["exclude_tables"] = exclude_tables
        output_path.write_bytes(b"data")
        return True

    monkeypatch.setattr(cli, "export_database", fake_export_database)

    result = runner.invoke(
        cli.app,
        [
            "export",
            "full",
            "--output-dir",
            str(tmp_path),
            "--exclude-tables",
            "table1,table2,table3",
        ],
    )

    assert result.exit_code == 0
    assert captured_args["exclude_tables"] == ["table1", "table2", "table3"]


def test_cli_export_full_failure(tmp_path: Path, monkeypatch):
    """Test CLI export handles export failure."""
    monkeypatch.setattr(cli, "datetime", FakeDatetimeModule.datetime)
    monkeypatch.setattr(cli, "export_database", lambda **kwargs: False)

    result = runner.invoke(cli.app, ["export", "full", "--output-dir", str(tmp_path)])

    assert result.exit_code == 1
    assert "❌ Database export failed" in result.output


def test_cli_export_schema_success(tmp_path: Path, monkeypatch):
    """Test CLI schema export command."""
    monkeypatch.setattr(cli, "datetime", FakeDatetimeModule.datetime)

    def fake_export_schema_only(output_path: Path, verbose: bool):
        output_path.write_bytes(b"schema")
        return True

    monkeypatch.setattr(cli, "export_schema_only", fake_export_schema_only)

    result = runner.invoke(cli.app, ["export", "schema", "--output-dir", str(tmp_path)])

    assert result.exit_code == 0
    expected = tmp_path / "db_schema_20240102_030405.sql"
    assert expected.exists()
    assert "Schema export completed" in result.stdout


def test_cli_restore_from_file_force_success(tmp_path: Path, monkeypatch):
    """Test CLI restore with force flag bypasses confirmation."""
    dump = tmp_path / "any.dump"
    dump.write_bytes(b"PGDMP" + b"\x00" * 5)

    monkeypatch.setattr(cli, "validate_dump_file", lambda p: True)
    monkeypatch.setattr(cli, "restore_database", lambda **kwargs: True)

    result = runner.invoke(cli.app, ["restore", "from-file", str(dump), "--force"])

    assert result.exit_code == 0
    assert "Database restore completed" in result.stdout


def test_cli_restore_from_file_invalid_dump(tmp_path: Path, monkeypatch):
    """Test CLI restore handles invalid dump files."""
    dump = tmp_path / "invalid.dump"
    dump.write_bytes(b"invalid")

    monkeypatch.setattr(cli, "validate_dump_file", lambda p: False)

    result = runner.invoke(cli.app, ["restore", "from-file", str(dump), "--force"])

    assert result.exit_code == 1
    assert "❌ Invalid dump file" in result.output


def test_cli_restore_from_file_confirmation_required(tmp_path: Path, monkeypatch):
    """Test CLI restore requires confirmation for destructive operations."""
    dump = tmp_path / "test.dump"
    dump.write_bytes(b"PGDMP" + b"\x00" * 5)

    monkeypatch.setattr(cli, "validate_dump_file", lambda p: True)
    monkeypatch.setattr(cli.typer, "confirm", lambda prompt: False)  # User cancels

    result = runner.invoke(cli.app, ["restore", "from-file", str(dump)])

    assert result.exit_code == 0
    assert "Operation cancelled" in result.stdout


def test_cli_restore_from_file_schema_only_no_confirmation(tmp_path: Path, monkeypatch):
    """Test CLI restore schema-only doesn't require confirmation."""
    dump = tmp_path / "test.dump"
    dump.write_bytes(b"PGDMP" + b"\x00" * 5)

    monkeypatch.setattr(cli, "validate_dump_file", lambda p: True)
    monkeypatch.setattr(cli, "restore_database", lambda **kwargs: True)

    # Schema-only should not trigger confirmation
    result = runner.invoke(
        cli.app, ["restore", "from-file", str(dump), "--schema-only"]
    )

    assert result.exit_code == 0
    assert "Database restore completed" in result.stdout


def test_cli_validate_dump_reports_custom_and_plain(tmp_path: Path, monkeypatch):
    """Test CLI validate command reports dump format and size correctly."""
    dump = tmp_path / "test.dump"
    dump.write_bytes(b"PGDMP" + b"\x00" * 1000)  # 1005 bytes

    monkeypatch.setattr(cli, "validate_dump_file", lambda p: True)
    monkeypatch.setattr(cli, "_is_custom_format_dump", lambda p: True)

    result = runner.invoke(cli.app, ["restore", "validate", str(dump)])

    assert result.exit_code == 0
    assert "Valid dump file" in result.stdout
    assert "Custom (binary)" in result.stdout
    assert "0.00 MB" in result.stdout  # 1005 bytes = ~0.00 MB


def test_cli_validate_dump_plain_format(tmp_path: Path, monkeypatch):
    """Test CLI validate command for plain SQL dumps."""
    dump = tmp_path / "test.sql"
    dump.write_text("CREATE TABLE test (id INTEGER);" * 100)  # Make it larger

    monkeypatch.setattr(cli, "validate_dump_file", lambda p: True)
    monkeypatch.setattr(cli, "_is_custom_format_dump", lambda p: False)

    result = runner.invoke(cli.app, ["restore", "validate", str(dump)])

    assert result.exit_code == 0
    assert "Valid dump file" in result.stdout
    assert "Plain SQL" in result.stdout


def test_cli_validate_dump_invalid(tmp_path: Path, monkeypatch):
    """Test CLI validate command for invalid dumps."""
    dump = tmp_path / "invalid.dump"

    monkeypatch.setattr(cli, "validate_dump_file", lambda p: False)

    result = runner.invoke(cli.app, ["restore", "validate", str(dump)])

    assert result.exit_code == 1
    assert "❌ Invalid dump file" in result.output


def test_cli_clean_db_cancelled(monkeypatch):
    """Test CLI clean database cancellation."""
    monkeypatch.setattr(cli.typer, "confirm", lambda prompt: False)

    result = runner.invoke(cli.app, ["restore", "clean-db"])

    assert result.exit_code == 0
    assert "Operation cancelled" in result.stdout


def test_cli_clean_db_force_success(monkeypatch):
    """Test CLI clean database with force flag."""
    monkeypatch.setattr(cli, "drop_all_tables", lambda confirm: True)

    result = runner.invoke(cli.app, ["restore", "clean-db", "--force"])

    assert result.exit_code == 0
    assert "All tables dropped successfully" in result.stdout


def test_cli_clean_db_failure(monkeypatch):
    """Test CLI clean database handles failures."""
    monkeypatch.setattr(cli, "drop_all_tables", lambda confirm: False)
    monkeypatch.setattr(cli.typer, "confirm", lambda prompt: True)

    result = runner.invoke(cli.app, ["restore", "clean-db"])

    assert result.exit_code == 1
    assert "❌ Failed to drop tables" in result.output


def test_export_check_pg_dump_missing(monkeypatch):
    """Test export check command when pg_dump is missing."""

    def fake_run(args, **kwargs):
        if "pg_dump" in args[0]:
            raise FileNotFoundError("pg_dump not found")
        return subprocess.CompletedProcess(
            args=args, returncode=0, stdout="", stderr=""
        )

    monkeypatch.setattr(cli.subprocess, "run", fake_run)

    result = runner.invoke(cli.app, ["export", "check"])

    assert result.exit_code == 1
    assert "❌ pg_dump not found" in result.output


def test_export_check_success(monkeypatch):
    """Test export check command success."""

    def fake_run(args, **kwargs):
        if "pg_dump" in args[0] and "--version" in args:
            return subprocess.CompletedProcess(
                args=args, returncode=0, stdout="pg_dump (PostgreSQL) 14.5\n", stderr=""
            )
        if "psql" in args[0] and "-c" in args:
            return subprocess.CompletedProcess(
                args=args,
                returncode=0,
                stdout=" ?column? \n----------\n        1\n",
                stderr="",
            )
        return subprocess.CompletedProcess(
            args=args, returncode=0, stdout="", stderr=""
        )

    monkeypatch.setattr(cli.subprocess, "run", fake_run)
    monkeypatch.setattr(
        cli, "get_pg_connection_params", lambda: {"PGHOST": "localhost"}
    )

    result = runner.invoke(cli.app, ["export", "check"])

    assert result.exit_code == 0
    assert "pg_dump available" in result.stdout
    assert "Database connection successful" in result.stdout


def test_restore_check_db_connection_failure(monkeypatch):
    """Test restore check command with database connection failure."""

    def fake_run(args, **kwargs):
        if args[0] in ("pg_restore", "psql") and "--version" in args:
            return subprocess.CompletedProcess(
                args=args, returncode=0, stdout="ver\n", stderr=""
            )
        if args[0] == "psql" and "-c" in args:
            raise subprocess.CalledProcessError(
                returncode=1, cmd=args, output="", stderr="conn failed"
            )
        return subprocess.CompletedProcess(
            args=args, returncode=0, stdout="", stderr=""
        )

    monkeypatch.setattr(cli.subprocess, "run", fake_run)
    monkeypatch.setattr(
        cli, "get_pg_connection_params", lambda: {"PGHOST": "localhost"}
    )

    result = runner.invoke(cli.app, ["restore", "check"])

    assert result.exit_code == 1
    assert "❌ Database connection failed" in result.output


def test_restore_check_success(monkeypatch):
    """Test restore check command success."""

    def fake_run(args, **kwargs):
        if args[0] in ("pg_restore", "psql") and "--version" in args:
            return subprocess.CompletedProcess(
                args=args,
                returncode=0,
                stdout=f"{args[0]} (PostgreSQL) 14.5\n",
                stderr="",
            )
        if args[0] == "psql" and "-c" in args:
            return subprocess.CompletedProcess(
                args=args,
                returncode=0,
                stdout=" ?column? \n----------\n        1\n",
                stderr="",
            )
        return subprocess.CompletedProcess(
            args=args, returncode=0, stdout="", stderr=""
        )

    monkeypatch.setattr(cli.subprocess, "run", fake_run)
    monkeypatch.setattr(
        cli, "get_pg_connection_params", lambda: {"PGHOST": "localhost"}
    )

    result = runner.invoke(cli.app, ["restore", "check"])

    assert result.exit_code == 0
    assert "pg_restore available" in result.stdout
    assert "psql available" in result.stdout
    assert "Database connection successful" in result.stdout


def test_cli_info_command():
    """Test CLI info command displays system information."""
    result = runner.invoke(cli.app, ["info"])

    assert result.exit_code == 0
    assert "Database Backup & Restore System" in result.stdout
    assert "Key features:" in result.stdout
    assert "Usage examples:" in result.stdout
