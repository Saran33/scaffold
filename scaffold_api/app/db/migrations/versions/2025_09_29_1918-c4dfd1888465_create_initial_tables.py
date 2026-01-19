"""Create user tables

Revision ID: c4dfd1888465
Revises:
Create Date: 2023-06-24 19:18:08.620338

"""

import sqlalchemy as sa
from alembic import op

revision = "c4dfd1888465"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user",
        sa.Column("first_name", sa.String(length=100), nullable=True),
        sa.Column("last_name", sa.String(length=100), nullable=True),
        sa.Column("nickname", sa.String(length=100), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("locale", sa.String(length=100), nullable=True),
        sa.Column("image", sa.String(length=255), nullable=True),
        sa.Column("password_hash", sa.String(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("email_verified", sa.Boolean(), nullable=False),
        sa.Column("is_superuser", sa.Boolean(), nullable=False),
        sa.Column(
            "role",
            sa.Enum(
                "user",
                "admin",
                name="user_role_enum",
            ),
            nullable=False,
        ),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "updated_dt",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("statement_timestamp()"),
            nullable=False,
        ),
        sa.Column(
            "created_dt",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("statement_timestamp()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_email"), "user", ["email"], unique=True)
    op.create_index(op.f("ix_user_id"), "user", ["id"], unique=False)
    op.create_index(op.f("ix_user_last_name"), "user", ["last_name"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_last_name"), table_name="user")
    op.drop_index(op.f("ix_user_id"), table_name="user")
    op.drop_index(op.f("ix_user_email"), table_name="user")
    op.drop_table("user")
