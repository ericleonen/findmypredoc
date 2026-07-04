# api

Read-only FastAPI service that queries the Neon `predoc`/`source` tables populated by
`service/` + `findmypredoc/`. Deployed together with `app/` as a single Vercel project via
[Services](https://vercel.com/docs/services) (see the repo-root `vercel.json`) — the `app/`
frontend reaches it over an internal service binding, and it's also usable directly as an
alternative query interface at `/api/*`.

All routes are mounted under `/api` (rather than the repo root) because the Services
rewrite (`/api/(.*)` → this service) forwards the matched path with the `/api` prefix
intact — see `app/server.py`.

## Running

Uses the same `.venv.dev` as the rest of the repo (from the repo root):

```sh
.venv.dev/Scripts/python.exe -m pip install -r api/requirements.txt  # first time only
.venv.dev/Scripts/python.exe -m uvicorn app.server:app --reload --app-dir api
```

Reads `DATABASE_URL` from `service/.env.local` (the same Neon connection string
`service/run_pipeline.py` uses).

## Endpoints

- `GET /api/predocs` — list postings (`error IS NULL` only, i.e. successfully-extracted). Filters and sorting below.
- `GET /api/predocs/{id}` — a single posting.
- `GET /api/sources` — the aggregator sources, with a count of successfully-extracted postings each.
- `GET /api/docs` / `GET /api/redoc` — interactive API docs (Swagger UI / ReDoc).

### `GET /api/predocs` filters

**First-class: application window + position start.** `pos_starts` / `app_opens` /
`app_closes` are free-text dates from the extraction schema (an exact day, a month, or a
season) — `app/dates.py` parses each into an `(earliest, latest)` range so they can be
ordered and range-filtered consistently regardless of precision.

- `application_status` (repeatable) — `open`, `upcoming`, `likely_closed`, `closed`, or
  `unknown`, computed from today's date vs. the parsed `pos_starts`/`app_opens`/`app_closes`
  ranges (see `dates.application_status`):
  - `closed` if the position's start date has passed (regardless of the application window),
    or if a closes date is known and has passed.
  - `likely_closed` if no closes date is known but an opens date is, and more than an assumed
    one-month application window has elapsed since opening.
  - `upcoming` if an opens date is known and hasn't arrived yet.
  - `unknown` if neither an opens nor a closes date could be determined.
  - `open` otherwise.
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
`application_status` (open, then upcoming, then unknown, then likely_closed, then closed),
then within `open` by soonest `closes` date and within `upcoming` by soonest `opens` date,
then by soonest `starts` date, then institution — i.e. the postings a student would want to
see first.

**Pagination:** `limit` (default 50, max 200), `offset`.

**Deduplication.** Rows that are identical across every field in the standard/first-class
filters above (institution, title, location, length, letters of recommendation, writing
sample, and the raw starts/opens/closes strings) except `url`/`source` are merged into one
posting — the same posting is sometimes mirrored at a different URL, or picked up by more
than one aggregator. The merged posting's top-level `id`/`url`/`source_name` are the
first-seen row's; every url that pointed to it (including that first one) is listed in
`links` as `{url, source_name}` pairs.
