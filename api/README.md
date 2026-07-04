# api

Read-only FastAPI service that queries the Neon `predoc`/`source` tables populated by
`service/` + `findmypredoc/`. Sits between the database and `app/`, and is also usable
directly as an alternative query interface.

## Running

Uses the same `.venv.dev` as the rest of the repo (from the repo root):

```sh
.venv.dev/Scripts/python.exe -m pip install -r api/requirements.txt  # first time only
.venv.dev/Scripts/python.exe -m uvicorn app.server:app --reload --app-dir api
```

Reads `DATABASE_URL` from `service/.env.local` (the same Neon connection string
`service/run_pipeline.py` uses).

## Endpoints

- `GET /predocs` — list postings (`success = true` only). Filters and sorting below.
- `GET /predocs/{id}` — a single posting.
- `GET /sources` — the aggregator sources, with a count of successfully-extracted postings each.

### `GET /predocs` filters

**First-class: application window + position start.** `pos_starts` / `app_opens` /
`app_closes` are free-text dates from the extraction schema (an exact day, a month, or a
season) — `app/dates.py` parses each into an `(earliest, latest)` range so they can be
ordered and range-filtered consistently regardless of precision.

- `application_status` (repeatable) — `open`, `upcoming`, `closed`, or `unknown`, computed
  from today's date vs. the parsed `app_opens`/`app_closes` range. A posting with no closes
  date is treated as still open; one with no opens date is treated as already open; one with
  neither is `unknown`.
- `starts_after` / `starts_before`, `opens_after` / `opens_before`, `closes_after` /
  `closes_before` — each pair filters to postings whose parsed date range overlaps
  `[after, before]`. A posting with no parseable date for that field never matches an
  after/before filter (there's nothing to confirm it against).

**Standard filters:** `institution`, `title`, `location` (substring, case-insensitive),
`source_id`, `source_name`, `min_letters_of_recommendation`,
`max_letters_of_recommendation`, `writing_sample` (bool).

**Sorting:** `sort` — `recommended` (default), `starts`, `opens`, `closes`, or
`institution`; prefix with `-` to reverse (e.g. `-starts`). Postings with an unparseable/
missing value for the chosen sort field always sort last. `recommended` groups by
`application_status` (open, then upcoming, then unknown, then closed), then within `open`
by soonest `closes` date and within `upcoming` by soonest `opens` date, then by soonest
`starts` date, then institution — i.e. the postings a student would want to see first.

**Pagination:** `limit` (default 50, max 200), `offset`.
