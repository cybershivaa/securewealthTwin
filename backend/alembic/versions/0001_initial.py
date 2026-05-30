"""initial securewealth schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-27
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "secure_payload_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("session_id", sa.String(length=128), nullable=False, index=True),
        sa.Column("request_id", sa.String(length=128), nullable=False, unique=True, index=True),
        sa.Column("key_id", sa.String(length=128), nullable=False),
        sa.Column("aad_hash", sa.String(length=64), nullable=False),
        sa.Column("iv", sa.LargeBinary(), nullable=False),
        sa.Column("ciphertext", sa.LargeBinary(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("metadata_json", sa.Text(), nullable=True),
    )
    op.create_index("ix_secure_payload_records_session_id", "secure_payload_records", ["session_id"])
    op.create_index("ix_secure_payload_records_request_id", "secure_payload_records", ["request_id"])

    op.create_table(
        "replay_cache_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("request_id", sa.String(length=128), nullable=False, unique=True, index=True),
        sa.Column("nonce", sa.LargeBinary(), nullable=False),
        sa.Column("session_id", sa.String(length=128), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_replay_cache_records_request_id", "replay_cache_records", ["request_id"])
    op.create_index("ix_replay_cache_records_session_id", "replay_cache_records", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_replay_cache_records_session_id", table_name="replay_cache_records")
    op.drop_index("ix_replay_cache_records_request_id", table_name="replay_cache_records")
    op.drop_table("replay_cache_records")
    op.drop_index("ix_secure_payload_records_request_id", table_name="secure_payload_records")
    op.drop_index("ix_secure_payload_records_session_id", table_name="secure_payload_records")
    op.drop_table("secure_payload_records")
