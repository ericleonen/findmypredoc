-- Adds parsed_at, the timestamp at which a posting was last read + extracted by the
-- pipeline (service/run_pipeline.py sets it to now() on every insert/reprocess). Backfills
-- existing rows to the time this migration runs, since their true parse time wasn't
-- recorded. Used to sort the README's "recent postings" list and could also power a
-- "re-check postings older than N days" job later.
--
-- Idempotent: safe to re-run (ADD COLUMN IF NOT EXISTS; the backfill only touches rows
-- that are still NULL).

ALTER TABLE predoc
    ADD COLUMN IF NOT EXISTS parsed_at timestamptz;

UPDATE predoc SET parsed_at = now() WHERE parsed_at IS NULL;

ALTER TABLE predoc
    ALTER COLUMN parsed_at SET DEFAULT now(),
    ALTER COLUMN parsed_at SET NOT NULL;
