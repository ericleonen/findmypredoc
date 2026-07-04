-- Adds generated earliest/latest DATE columns for each of predoc's free-text fuzzy date
-- fields (pos_starts, app_opens, app_closes -- each an exact day "2026-07-01", a month
-- "July 2026", or a season "Summer 2026"), mirroring the parsing api/app/dates.py does at
-- query time. Having these as real, indexable DATE columns in Postgres lets you query for
-- data-quality problems directly, e.g.:
--
--   -- Postings whose start date is entirely before the application window could even open
--   -- (usually an extraction mistake -- a stale/current cohort's start date paired with the
--   -- next cohort's application window).
--   SELECT id, url, pos_starts, app_opens
--   FROM predoc
--   WHERE pos_starts_latest < app_opens_earliest;
--
-- Idempotent: safe to re-run (CREATE OR REPLACE FUNCTION, ADD COLUMN IF NOT EXISTS).

CREATE OR REPLACE FUNCTION fuzzy_date_earliest(value text)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    iso_match text[];
    word_match text[];
    year_num int;
BEGIN
    IF value IS NULL THEN
        RETURN NULL;
    END IF;

    iso_match := regexp_match(value, '^(\d{4})-(\d{2})-(\d{2})$');
    IF iso_match IS NOT NULL THEN
        RETURN make_date(iso_match[1]::int, iso_match[2]::int, iso_match[3]::int);
    END IF;

    word_match := regexp_match(value, '^([A-Za-z]+)\s+(\d{4})$');
    IF word_match IS NULL THEN
        RETURN NULL;
    END IF;

    year_num := word_match[2]::int;

    RETURN CASE lower(word_match[1])
        WHEN 'january'   THEN make_date(year_num, 1, 1)
        WHEN 'february'  THEN make_date(year_num, 2, 1)
        WHEN 'march'     THEN make_date(year_num, 3, 1)
        WHEN 'april'     THEN make_date(year_num, 4, 1)
        WHEN 'may'       THEN make_date(year_num, 5, 1)
        WHEN 'june'      THEN make_date(year_num, 6, 1)
        WHEN 'july'      THEN make_date(year_num, 7, 1)
        WHEN 'august'    THEN make_date(year_num, 8, 1)
        WHEN 'september' THEN make_date(year_num, 9, 1)
        WHEN 'october'   THEN make_date(year_num, 10, 1)
        WHEN 'november'  THEN make_date(year_num, 11, 1)
        WHEN 'december'  THEN make_date(year_num, 12, 1)
        WHEN 'spring'    THEN make_date(year_num, 3, 1)
        WHEN 'summer'    THEN make_date(year_num, 6, 1)
        WHEN 'fall'      THEN make_date(year_num, 9, 1)
        WHEN 'autumn'    THEN make_date(year_num, 9, 1)
        WHEN 'winter'    THEN make_date(year_num, 12, 1)
        ELSE NULL
    END;
END;
$$;

CREATE OR REPLACE FUNCTION _end_of_month(year_num int, month_num int)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT (date_trunc('month', make_date(year_num, month_num, 1)) + interval '1 month - 1 day')::date;
$$;

CREATE OR REPLACE FUNCTION fuzzy_date_latest(value text)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    iso_match text[];
    word_match text[];
    year_num int;
BEGIN
    IF value IS NULL THEN
        RETURN NULL;
    END IF;

    iso_match := regexp_match(value, '^(\d{4})-(\d{2})-(\d{2})$');
    IF iso_match IS NOT NULL THEN
        RETURN make_date(iso_match[1]::int, iso_match[2]::int, iso_match[3]::int);
    END IF;

    word_match := regexp_match(value, '^([A-Za-z]+)\s+(\d{4})$');
    IF word_match IS NULL THEN
        RETURN NULL;
    END IF;

    year_num := word_match[2]::int;

    RETURN CASE lower(word_match[1])
        WHEN 'january'   THEN _end_of_month(year_num, 1)
        WHEN 'february'  THEN _end_of_month(year_num, 2)
        WHEN 'march'     THEN _end_of_month(year_num, 3)
        WHEN 'april'     THEN _end_of_month(year_num, 4)
        WHEN 'may'       THEN _end_of_month(year_num, 5)
        WHEN 'june'      THEN _end_of_month(year_num, 6)
        WHEN 'july'      THEN _end_of_month(year_num, 7)
        WHEN 'august'    THEN _end_of_month(year_num, 8)
        WHEN 'september' THEN _end_of_month(year_num, 9)
        WHEN 'october'   THEN _end_of_month(year_num, 10)
        WHEN 'november'  THEN _end_of_month(year_num, 11)
        WHEN 'december'  THEN _end_of_month(year_num, 12)
        -- Seasons span 3 months; winter is the one that crosses a year boundary.
        WHEN 'spring'    THEN _end_of_month(year_num, 5)
        WHEN 'summer'    THEN _end_of_month(year_num, 8)
        WHEN 'fall'      THEN _end_of_month(year_num, 11)
        WHEN 'autumn'    THEN _end_of_month(year_num, 11)
        WHEN 'winter'    THEN _end_of_month(year_num + 1, 2)
        ELSE NULL
    END;
END;
$$;

ALTER TABLE predoc
    ADD COLUMN IF NOT EXISTS pos_starts_earliest date GENERATED ALWAYS AS (fuzzy_date_earliest(pos_starts)) STORED,
    ADD COLUMN IF NOT EXISTS pos_starts_latest   date GENERATED ALWAYS AS (fuzzy_date_latest(pos_starts)) STORED,
    ADD COLUMN IF NOT EXISTS app_opens_earliest   date GENERATED ALWAYS AS (fuzzy_date_earliest(app_opens)) STORED,
    ADD COLUMN IF NOT EXISTS app_opens_latest     date GENERATED ALWAYS AS (fuzzy_date_latest(app_opens)) STORED,
    ADD COLUMN IF NOT EXISTS app_closes_earliest  date GENERATED ALWAYS AS (fuzzy_date_earliest(app_closes)) STORED,
    ADD COLUMN IF NOT EXISTS app_closes_latest    date GENERATED ALWAYS AS (fuzzy_date_latest(app_closes)) STORED;
