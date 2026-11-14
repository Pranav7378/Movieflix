"""create_universal_catalogue_and_interactions

Revision ID: f0cb287e258d
Revises: 
Create Date: 2026-11-14 17:11:12.411294

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = 'f0cb287e258d'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Clean drop of legacy application tables
    conn = op.get_bind()
    for legacy in ['history', 'movie_cache', 'watchlist']:
        conn.execute(sa.text(f"DROP TABLE IF EXISTS {legacy}"))

    # 2. Recreate clean tables if not already present
    from src.server.db.models import Base
    Base.metadata.create_all(bind=conn)


def downgrade() -> None:
    conn = op.get_bind()
    for table in [
        'episodes', 'seasons', 'content_genres', 'genres',
        'user_content_interactions', 'content_identifiers', 'content_items', 'users'
    ]:
        conn.execute(sa.text(f"DROP TABLE IF EXISTS {table}"))
