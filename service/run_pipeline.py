"""
The scheduled job (run manually for now) that refreshes the Neon `predoc` database from
findmypredoc's four sources: fetch each source's posting URLs, skip any URL already in the
database (success or failure -- postings are assumed permanent, so a prior failure is never
retried, to avoid re-spending LLM tokens on it), read + extract the rest, and upsert the
results.

Consumes `findmypredoc` the same way `experiments/` does, via the editable install -- run with
the same venv used for the package (see repo CLAUDE.md).

Retrying specific rows (e.g. after an API outage or hitting a spend cap mid-run):

    # Reprocess PREDOC.org's failures the next time their URLs are scraped, instead of
    # skipping them as already-seen.
    python run_pipeline.py --overwrite-where "source.name = 'PREDOC.org' AND predoc.error IS NOT NULL"

    # Same, but don't re-scrape any source at all -- just iterate the matching predoc rows
    # directly and reprocess them. Requires --overwrite-where (there's no "just re-run
    # everything" footgun here).
    python run_pipeline.py --from-db --overwrite-where "source.name = 'PREDOC.org' AND predoc.error IS NOT NULL"

--overwrite-where is a raw SQL boolean expression referencing predoc.*/source.* columns,
interpolated directly into the query -- this is a local script only you run, not a public API.
"""

import argparse
import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from tqdm import tqdm

import pipeline
from sources import sources

load_dotenv()  # repo-root .env -> ANTHROPIC_API_KEY
load_dotenv(Path(__file__).parent / ".env.local")  # DATABASE_URL

EXTRACTION_MODEL = "claude-opus-4-8"

# $ per million tokens (https://platform.claude.com/docs/en/pricing)
PRICING_PER_MILLION_TOKENS = {
    "claude-opus-4-8": {"input": 5.00, "output": 25.00, "cache_write": 6.25, "cache_read": 0.50},
}


def extraction_cost(usage) -> float:
    rates = PRICING_PER_MILLION_TOKENS[EXTRACTION_MODEL]
    return (
        usage.input_tokens * rates["input"]
        + usage.output_tokens * rates["output"]
        + usage.cache_creation_input_tokens * rates["cache_write"]
        + usage.cache_read_input_tokens * rates["cache_read"]
    ) / 1_000_000


FIELD_TO_COLUMN = {
    ("position", "institution"): "pos_institution",
    ("position", "title"): "pos_title",
    ("position", "location"): "pos_location",
    ("position", "starts"): "pos_starts",
    ("position", "length"): "pos_length",
    ("application", "opens"): "app_opens",
    ("application", "closes"): "app_closes",
    ("application", "letters_of_recommendation"): "app_letters_of_recommendation",
    ("application", "writing_sample"): "app_writing_sample",
}

_VALUE_COLUMNS = [col for pair in ((col, f"{col}_why") for col in FIELD_TO_COLUMN.values()) for col in pair]
_UPDATE_COLUMNS = ["source_id", "error"] + _VALUE_COLUMNS

# ON CONFLICT DO UPDATE so a URL selected for reprocessing (via --overwrite-where) overwrites
# its existing row in place rather than being silently dropped.
UPSERT_PREDOC_SQL = f"""
    INSERT INTO predoc (source_id, url, error, {", ".join(_VALUE_COLUMNS)})
    VALUES (%(source_id)s, %(url)s, %(error)s,
            {", ".join(f"%({col})s" for col in _VALUE_COLUMNS)})
    ON CONFLICT (url) DO UPDATE SET
        {", ".join(f"{col} = EXCLUDED.{col}" for col in _UPDATE_COLUMNS)}
"""


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--overwrite-where",
        dest="overwrite_where",
        default=None,
        help="Raw SQL boolean expression (referencing predoc.*/source.* columns) selecting "
        "existing predoc rows to reprocess instead of skip.",
    )
    parser.add_argument(
        "--from-db",
        dest="from_db",
        action="store_true",
        help="Iterate URLs already in the predoc table (matching --overwrite-where) instead of "
        "scraping the live sources. Requires --overwrite-where.",
    )
    args = parser.parse_args()

    if args.from_db and not args.overwrite_where:
        parser.error("--from-db requires --overwrite-where")

    return args


def get_or_create_source_id(cur, name: str, url: str):
    cur.execute("SELECT id FROM source WHERE name = %s", (name,))
    row = cur.fetchone()
    if row is not None:
        return row[0]

    cur.execute("INSERT INTO source (name, url) VALUES (%s, %s) RETURNING id", (name, url))
    return cur.fetchone()[0]


def fetch_overwrite_urls(cur, overwrite_where: str) -> set:
    if not overwrite_where:
        return set()
    cur.execute(f"SELECT predoc.url FROM predoc JOIN source ON source.id = predoc.source_id WHERE {overwrite_where}")
    return {row[0] for row in cur.fetchall()}


def fetch_db_urls(cur, overwrite_where: str) -> list:
    cur.execute(
        f"""
        SELECT predoc.url, predoc.source_id
        FROM predoc JOIN source ON source.id = predoc.source_id
        WHERE {overwrite_where}
        """
    )
    return cur.fetchall()


def extracted_row(extraction: dict) -> dict:
    row = {}
    for (area, field), col in FIELD_TO_COLUMN.items():
        row[col] = extraction[area][field]["value"]
        row[f"{col}_why"] = extraction[area][field]["why"]
    return row


def empty_row() -> dict:
    row = {}
    for col in FIELD_TO_COLUMN.values():
        row[col] = None
        row[f"{col}_why"] = None
    return row


def process_url(cur, url: str, source_id, totals: dict) -> None:
    """
    Reads and extracts a single posting, tagging any failure with which stage it came from
    ("READ: ..." vs "EXTRACT: ...", the latter also covering the extraction schema's own
    validation errors) so a failure can be traced back to the reader or the LLM.
    """
    error = None
    fields = empty_row()

    try:
        text = pipeline.read(url)
    except Exception as e:
        error = f"READ: {type(e).__name__}: {e}"

    if error is None:
        try:
            extraction, usage = pipeline.extract(text, anthropic_model=EXTRACTION_MODEL, return_usage=True)
            fields = extracted_row(extraction)
            totals["extracted"] += 1
            totals["cost"] += extraction_cost(usage)
        except Exception as e:
            error = f"EXTRACT: {type(e).__name__}: {e}"

    if error is not None:
        totals["failed"] += 1

    row = {"source_id": source_id, "url": url, "error": error}
    row.update(fields)
    cur.execute(UPSERT_PREDOC_SQL, row)


def _set_cost_postfix(progress: tqdm, totals: dict) -> None:
    if totals["extracted"] > 0:
        progress.set_postfix(avg_cost=f"${totals['cost'] / totals['extracted']:.4f}")


def main():
    args = parse_args()

    conn = psycopg.connect(os.environ["DATABASE_URL"], autocommit=True)
    cur = conn.cursor()

    totals = {"extracted": 0, "failed": 0, "skipped": 0, "cost": 0.0}

    if args.from_db:
        rows = fetch_db_urls(cur, args.overwrite_where)
        progress = tqdm(rows, desc="Reprocessing from DB", unit="posting", dynamic_ncols=True)
        for url, source_id in progress:
            process_url(cur, url, source_id, totals)
            _set_cost_postfix(progress, totals)
    else:
        cur.execute("SELECT url FROM predoc")
        seen_urls = {row[0] for row in cur.fetchall()}
        overwrite_urls = fetch_overwrite_urls(cur, args.overwrite_where)

        for source in sources:
            source_id = get_or_create_source_id(cur, source.name, source.url)

            source.fetch()
            candidate_urls = [
                url for url in source.position_urls if url not in seen_urls or url in overwrite_urls
            ]
            totals["skipped"] += len(source.position_urls) - len(candidate_urls)

            progress = tqdm(candidate_urls, desc=source.name, unit="posting", dynamic_ncols=True)
            for url in progress:
                seen_urls.add(url)
                process_url(cur, url, source_id, totals)
                _set_cost_postfix(progress, totals)

    new_links = totals["extracted"] + totals["failed"]
    success_rate = (totals["extracted"] / new_links * 100) if new_links else 0.0

    print(
        f"\nDone. Extracted {totals['extracted']}, failed {totals['failed']}, "
        f"skipped {totals['skipped']} already-seen URLs. Success rate: {success_rate:.1f}%. "
        f"Total extraction cost: ${totals['cost']:.4f}"
    )

    # Surface this run's totals as step outputs so the ingest workflow can email a summary
    # when new links were actually found -- a no-op outside GitHub Actions (GITHUB_OUTPUT unset).
    github_output = os.environ.get("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a") as f:
            f.write(f"new_links={new_links}\n")
            f.write(f"extracted={totals['extracted']}\n")
            f.write(f"failed={totals['failed']}\n")
            f.write(f"skipped={totals['skipped']}\n")
            f.write(f"success_rate={success_rate:.1f}\n")
            f.write(f"cost={totals['cost']:.4f}\n")


if __name__ == "__main__":
    main()
