from datetime import date
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from .. import db
from ..dates import DateRange, application_status, parse_fuzzy_date
from ..schemas import Predoc, PredocList

router = APIRouter(prefix="/predocs", tags=["predocs"])

_VALID_APPLICATION_STATUSES = {"open", "upcoming", "closed", "unknown"}
_SORTABLE_FIELDS = {
    "recommended": None,  # handled specially -- see _recommended_sort_key
    "starts": "starts_earliest",
    "opens": "opens_earliest",
    "closes": "closes_earliest",
    "institution": "institution",
}
_STATUS_PRIORITY = {"open": 0, "upcoming": 1, "unknown": 2, "closed": 3}


def _select_query() -> str:
    return """
        SELECT
            p.id::text AS id,
            p.source_id::text AS source_id,
            s.name AS source_name,
            p.url,
            p.pos_institution AS institution,
            p.pos_title AS title,
            p.pos_location AS location,
            p.pos_length AS length,
            p.app_letters_of_recommendation AS letters_of_recommendation,
            p.app_writing_sample AS writing_sample,
            p.pos_starts AS starts,
            p.app_opens AS opens,
            p.app_closes AS closes
        FROM predoc p
        LEFT JOIN source s ON s.id = p.source_id
        WHERE p.error IS NULL
    """


def _fetch_rows(
    institution: Optional[str],
    title: Optional[str],
    location: Optional[str],
    source_id: Optional[str],
    source_name: Optional[str],
    min_letters: Optional[int],
    max_letters: Optional[int],
    writing_sample: Optional[bool],
) -> list[dict]:
    query = _select_query()
    params: list = []

    if institution:
        query += " AND p.pos_institution ILIKE %s"
        params.append(f"%{institution}%")
    if title:
        query += " AND p.pos_title ILIKE %s"
        params.append(f"%{title}%")
    if location:
        query += " AND p.pos_location ILIKE %s"
        params.append(f"%{location}%")
    if source_id:
        query += " AND p.source_id = %s"
        params.append(source_id)
    if source_name:
        query += " AND s.name ILIKE %s"
        params.append(f"%{source_name}%")
    if min_letters is not None:
        query += " AND p.app_letters_of_recommendation >= %s"
        params.append(min_letters)
    if max_letters is not None:
        query += " AND p.app_letters_of_recommendation <= %s"
        params.append(max_letters)
    if writing_sample is not None:
        query += " AND p.app_writing_sample = %s"
        params.append(writing_sample)

    with db.pool.connection() as conn:
        return conn.execute(query, params).fetchall()


def _enrich(row: dict) -> dict:
    starts = parse_fuzzy_date(row["starts"])
    opens = parse_fuzzy_date(row["opens"])
    closes = parse_fuzzy_date(row["closes"])

    row["starts_earliest"] = starts.earliest if starts else None
    row["starts_latest"] = starts.latest if starts else None
    row["opens_earliest"] = opens.earliest if opens else None
    row["opens_latest"] = opens.latest if opens else None
    row["closes_earliest"] = closes.earliest if closes else None
    row["closes_latest"] = closes.latest if closes else None
    row["application_status"] = application_status(opens, closes)
    return row


def _date_range_overlaps(row: dict, prefix: str, after: Optional[date], before: Optional[date]) -> bool:
    if after is None and before is None:
        return True

    earliest, latest = row[f"{prefix}_earliest"], row[f"{prefix}_latest"]
    if earliest is None:
        return False
    if after is not None and latest < after:
        return False
    if before is not None and earliest > before:
        return False
    return True


def _recommended_sort_key(row: dict):
    status = row["application_status"]
    if status == "open":
        urgency = row["closes_earliest"] or date.max
    elif status == "upcoming":
        urgency = row["opens_earliest"] or date.max
    else:
        urgency = date.max

    return (
        _STATUS_PRIORITY[status],
        urgency,
        row["starts_earliest"] or date.max,
        (row["institution"] or "").lower(),
    )


def _sort_rows(rows: list[dict], sort: str) -> list[dict]:
    descending = sort.startswith("-")
    field = sort[1:] if descending else sort

    if field not in _SORTABLE_FIELDS:
        raise HTTPException(400, f"Unknown sort field {field!r}. Valid: {sorted(_SORTABLE_FIELDS)}")

    if field == "recommended":
        return sorted(rows, key=_recommended_sort_key)

    column = _SORTABLE_FIELDS[field]
    with_value = [r for r in rows if r[column] is not None]
    without_value = [r for r in rows if r[column] is None]
    with_value.sort(key=lambda r: r[column], reverse=descending)
    return with_value + without_value


@router.get("", response_model=PredocList)
def list_predocs(
    # First-class filter: application window status and position start date.
    application_status_in: List[str] = Query(
        default=[],
        alias="application_status",
        description="Filter to postings whose application window is one of these statuses: "
        "open, upcoming, closed, unknown. Repeatable, e.g. ?application_status=open&application_status=upcoming.",
    ),
    starts_after: Optional[date] = Query(None, description="Only postings that could start on or after this date"),
    starts_before: Optional[date] = Query(None, description="Only postings that could start on or before this date"),
    opens_after: Optional[date] = None,
    opens_before: Optional[date] = None,
    closes_after: Optional[date] = None,
    closes_before: Optional[date] = None,
    # Standard filters.
    institution: Optional[str] = None,
    title: Optional[str] = None,
    location: Optional[str] = None,
    source_id: Optional[str] = None,
    source_name: Optional[str] = None,
    min_letters_of_recommendation: Optional[int] = None,
    max_letters_of_recommendation: Optional[int] = None,
    writing_sample: Optional[bool] = None,
    # Sorting and pagination.
    sort: str = Query("recommended", description="recommended, starts, opens, closes, or institution; prefix with - to reverse"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    for status in application_status_in:
        if status not in _VALID_APPLICATION_STATUSES:
            raise HTTPException(400, f"Invalid application_status {status!r}. Valid: {sorted(_VALID_APPLICATION_STATUSES)}")

    rows = _fetch_rows(
        institution=institution,
        title=title,
        location=location,
        source_id=source_id,
        source_name=source_name,
        min_letters=min_letters_of_recommendation,
        max_letters=max_letters_of_recommendation,
        writing_sample=writing_sample,
    )
    rows = [_enrich(row) for row in rows]

    if application_status_in:
        rows = [r for r in rows if r["application_status"] in application_status_in]
    rows = [r for r in rows if _date_range_overlaps(r, "starts", starts_after, starts_before)]
    rows = [r for r in rows if _date_range_overlaps(r, "opens", opens_after, opens_before)]
    rows = [r for r in rows if _date_range_overlaps(r, "closes", closes_after, closes_before)]

    rows = _sort_rows(rows, sort)

    total = len(rows)
    page = rows[offset : offset + limit]

    return PredocList(total=total, limit=limit, offset=offset, items=page)


@router.get("/{predoc_id}", response_model=Predoc)
def get_predoc(predoc_id: str):
    query = _select_query() + " AND p.id = %s"
    with db.pool.connection() as conn:
        row = conn.execute(query, [predoc_id]).fetchone()

    if row is None:
        raise HTTPException(404, "Predoc posting not found")

    return _enrich(row)
