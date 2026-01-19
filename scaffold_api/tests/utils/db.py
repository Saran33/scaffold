import warnings

from sqlalchemy import Connection, text
from sqlalchemy.exc import SAWarning


def get_db_name(worker_id: str) -> str:
    return "test" if worker_id == "master" else f"test_{worker_id}"


def close_connections(conn: Connection, db_name: str):
    conn.execute(
        text(
            """
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = :datname
            AND pid <> pg_backend_pid();
        """
        ),
        {"datname": db_name},
    ).fetchall()


def ignore_deassociated_warning():
    warnings.filterwarnings(
        "ignore", "transaction already deassociated from connection", SAWarning
    )
