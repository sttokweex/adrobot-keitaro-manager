"""Create the SQLAlchemy offer archive table."""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "0001_offer_archive"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Existing sqlite3 installations already have this table. Preserve it and
    # mark the initial migration as applied instead of recreating the archive.
    if not inspect(op.get_bind()).has_table("offer_archive"):
        op.create_table(
            "offer_archive",
            sa.Column("campaign_id", sa.Integer(), nullable=False),
            sa.Column("stream_id", sa.Integer(), nullable=False),
            sa.Column("offer_id", sa.Integer(), nullable=False),
            sa.Column("name", sa.Text(), nullable=False),
            sa.Column("current_share", sa.Integer(), server_default="0", nullable=False),
            sa.Column("remote_share", sa.Integer(), nullable=True),
            sa.Column("status", sa.Text(), server_default="active", nullable=False),
            sa.Column("pinned", sa.Integer(), server_default="0", nullable=False),
            sa.Column("updated_at", sa.Text(), nullable=False),
            sa.PrimaryKeyConstraint("campaign_id", "stream_id", "offer_id"),
        )

def downgrade() -> None:
    op.drop_table("offer_archive")
