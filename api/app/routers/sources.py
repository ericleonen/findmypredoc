from fastapi import APIRouter

from .. import db
from ..schemas import Source

router = APIRouter(prefix="/sources", tags=["sources"])


@router.get("", response_model=list[Source])
def list_sources():
    with db.pool.connection() as conn:
        rows = conn.execute(
            """
            SELECT s.id::text AS id, s.name, s.url, count(p.id) FILTER (WHERE p.error IS NULL) AS posting_count
            FROM source s
            LEFT JOIN predoc p ON p.source_id = s.id
            GROUP BY s.id, s.name, s.url
            ORDER BY s.name
            """
        ).fetchall()
    return rows
