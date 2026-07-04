"""
The scheduled job (run manually for now) that refreshes the Neon `predoc` database from
findmypredoc's four sources: fetch each source's posting URLs, skip any URL already in the
database (success or failure -- postings are assumed permanent, so a prior failure is never
retried, to avoid re-spending LLM tokens on it), read + extract the rest, and upsert the
results.

Consumes `findmypredoc` the same way `experiments/` does, via the editable install -- run with
the same venv used for the package (see repo CLAUDE.md).
"""

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

INSERT_PREDOC_SQL = f"""
    INSERT INTO predoc (source_id, url, success, {", ".join(_VALUE_COLUMNS)})
    VALUES (%(source_id)s, %(url)s, %(success)s,
            {", ".join(f"%({col})s" for col in _VALUE_COLUMNS)})
    ON CONFLICT (url) DO NOTHING
"""


def get_or_create_source_id(cur, name: str, url: str):
    cur.execute("SELECT id FROM source WHERE name = %s", (name,))
    row = cur.fetchone()
    if row is not None:
        return row[0]

    cur.execute("INSERT INTO source (name, url) VALUES (%s, %s) RETURNING id", (name, url))
    return cur.fetchone()[0]


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


def main():
    conn = psycopg.connect(os.environ["DATABASE_URL"], autocommit=True)
    cur = conn.cursor()

    cur.execute("SELECT url FROM predoc")
    seen_urls = {row[0] for row in cur.fetchall()}

    totals = {"extracted": 0, "failed": 0, "skipped": 0}
    total_cost = 0.0

    for source in sources:
        source_id = get_or_create_source_id(cur, source.name, source.url)

        source.fetch()
        new_urls = [url for url in source.position_urls if url not in seen_urls]
        totals["skipped"] += len(source.position_urls) - len(new_urls)

        progress = tqdm(new_urls, desc=source.name, unit="posting", dynamic_ncols=True)
        for url in progress:
            seen_urls.add(url)

            try:
                text = pipeline.read(url)
                extraction, usage = pipeline.extract(text, anthropic_model=EXTRACTION_MODEL, return_usage=True)
                row = {"source_id": source_id, "url": url, "success": True}
                row.update(extracted_row(extraction))
                totals["extracted"] += 1
                total_cost += extraction_cost(usage)
            except Exception as e:
                print(f"Error extracting position from {url}: {type(e).__name__}: {repr(e)}")
                row = {"source_id": source_id, "url": url, "success": False}
                row.update(empty_row())
                totals["failed"] += 1

            cur.execute(INSERT_PREDOC_SQL, row)

            if totals["extracted"] > 0:
                progress.set_postfix(avg_cost=f"${total_cost / totals['extracted']:.4f}")

    print(
        f"\nDone. Extracted {totals['extracted']}, failed {totals['failed']}, "
        f"skipped {totals['skipped']} already-seen URLs. Total extraction cost: ${total_cost:.4f}"
    )


if __name__ == "__main__":
    main()
