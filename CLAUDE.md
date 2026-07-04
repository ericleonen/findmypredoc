# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

`findmypredoc` scrapes pre-doctoral research-assistant ("predoc") job listings from
aggregator sources (NBER, Econ Job Market, PREDOC.org), reads each posting (web page, PDF,
DOCX, or Google Drive file), and uses the Anthropic API to extract structured fields into a
schema. A daily job (`service/`) upserts the results into a Neon Postgres database, which a
read-only API (`api/`) serves to a Next.js frontend (`app/`). `api/` and `app/` deploy
together as a single Vercel project via [Services](https://vercel.com/docs/services) — see
the repo-root `vercel.json`.

The repo is organized as several independent top-level components:

- **`findmypredoc/`** — the Python scraping/extraction package (see below). Implemented.
- **`experiments/`** — scratch scripts that exercise `findmypredoc` as an external consumer
  (via the editable install), used to validate the package end-to-end and try out different
  extraction models/failure modes against live data. Deliberately **outside** the
  `findmypredoc/` package — it is not shipped, just a harness around it.
- **`service/`** — the daily job that runs `findmypredoc`'s pipeline and upserts results into
  the Neon `predoc`/`source` tables, skipping any URL already in the database (success or
  failure) to avoid re-spending LLM tokens. Run manually today; not yet wired to a scheduler.
- **`api/`** — a read-only FastAPI service querying the same Neon tables, mounted entirely
  under `/api/*`. Implemented.
- **`app/`** — the Next.js frontend: a filterable table of postings. Implemented (first draft).

Each of `experiments/`, `service/`, `api/`, and `app/` has its own `README.md` with more detail.

## Environment & commands

Two pre-built virtualenvs live at the **repo root**: `.venv.dev` (fully provisioned) and
`.venv.prod` (currently only the `findmypredoc` package itself is registered; runtime deps
not yet installed). Both are Windows layout (`Scripts/python.exe`). Use one of these rather
than the system Python, from the repo root:

```sh
# (Re)install the findmypredoc package + deps editable — needed after cloning or changing
# findmypredoc/pyproject.toml. Run with cwd at findmypredoc/ (where pyproject.toml lives).
findmypredoc/.venv.dev/Scripts/python.exe -m pip install -e ".[dev]"

# Run the daily ingestion job (service/, see below)
.venv.dev/Scripts/python.exe service/run_pipeline.py

# Run the API (api/, see below)
.venv.dev/Scripts/python.exe -m uvicorn app.server:app --reload --app-dir api

# Run api/ + app/ together the way they run in production (Vercel Services) --
# requires the Vercel CLI (npx vercel) and the project linked (npx vercel link)
vercel dev
```

The `findmypredoc` package is installed **editable**, so `import pipeline` / `import
sources` and their submodules resolve from any working directory — no `sys.path` juggling.
Runtime deps are declared in `findmypredoc/pyproject.toml` (`anthropic`, `beautifulsoup4`,
`requests`, `playwright`, `python-dotenv`, `tqdm`, `pypdf`, `python-docx`, `truststore`;
`ipykernel` under the `dev` extra). `service/` and `api/` each declare their own additional
deps in their own `requirements.txt` (installed into the same shared `.venv.dev`). To
provision `.venv.prod`, run `.venv.prod/Scripts/python.exe -m pip install -e findmypredoc`
(drops `--no-deps`).

Requires a `.env` file at the **repo root** with `ANTHROPIC_API_KEY=...`, and a
`service/.env.local` with `DATABASE_URL=...` (pulled from Neon via `neonctl env pull`; see
`service/README.md`). Any script that calls bare `dotenv.load_dotenv()` finds the repo-root
`.env` automatically — `load_dotenv()` walks up from the calling script's own directory, not
the process's CWD, so this works regardless of where a script lives in the repo or where
it's invoked from. Playwright is used for JS-rendered pages; if browsers aren't installed
run `.venv.dev/Scripts/playwright.exe install chromium`.

## `findmypredoc/` — the scraper package

Early-stage / work-in-progress. Two intended layers, meant to compose as
`Source -> pipeline.read(url) -> pipeline.extract(text)`:

- **`sources/`** — a `Source` (`sources/Source.py`) is `(name, url, extract_position_urls)`.
  `Source.fetch()` scrapes the aggregator page into a deduplicated list of posting URLs;
  `Source.extract_positions()` then runs each URL through `pipeline.read` + `pipeline.extract`.
  Four concrete sources are defined, and collected into the `sources` list in
  `sources/__init__.py`: `nber_not_at_nber.py` and `nber_at_nber.py` (NBER's two RA-listing
  pages), `ejm.py` (Econ Job Market), and `predoc.py` (PREDOC.org).

- **`pipeline/read/`** — `read(url)` dispatches by URL type to `website` / `pdf` / `docx` /
  `google_drive_file` submodules, then strips boilerplate tags (`script`, `nav`, `footer`, …)
  with BeautifulSoup and returns cleaned text (harmless no-op for the plain-text submodules,
  since there are no tags to strip). `website.read` tries a plain HTTP GET first; if the
  resulting page has too little visible text (JS-rendered content), it retries with a headless
  Playwright browser that waits for the page to load. `pdf` and `docx` download the file and
  extract text via `pypdf` / `python-docx` (each also exposes a `read_bytes` for reuse).
  `google_drive_file` exports native Google Docs as plain text and otherwise downloads the
  file and dispatches to `pdf`/`docx` by sniffing magic bytes, handling Drive's
  virus-scan-warning interstitial for larger files.

- **`pipeline/extract/`** — `extract(text, schema)` calls the Anthropic Messages API with a
  single forced tool (`extract_predoc_posting_info`) and returns the tool-use input dict (or,
  with `return_usage=True`, a `(result, response.usage)` tuple for cost tracking).
  `schema.json` defines the domain fields (grouped into `position` and `application`) as
  `{nullable, type, description}`. `format_schema.py` expands that compact schema into a strict
  JSON Schema where every field becomes `{value, why}` — `why` requires a brief explanation in
  the model's own words (not a verbatim quote) grounding each extracted value. When changing
  extracted fields, edit `schema.json`, not the generated JSON Schema. After the tool call
  returns, `_null_inconsistent_starts` nulls `position.starts` if it's inconsistent with
  `application.opens` (see below) using `dates.py`'s fuzzy-date parser (a small copy of
  `api/app/dates.py`'s, kept separate since `api/` and `findmypredoc/` are independent
  deployables).

The default extraction model is `claude-opus-4-8` (see `pipeline/extract/__init__.py`).

**Start/application-cycle consistency.** Postings often describe a recurring position (e.g.
"predocs start each summer") alongside a specific upcoming application cycle -- these can
describe different hiring cycles, and the model can otherwise pair a past/generic start date
with the next cycle's application window. The system prompt instructs the model to infer
`position.starts` for the same cycle as `application.opens`/`application.closes`; as a
backstop, `_null_inconsistent_starts` nulls `position.starts` if it falls entirely before
`application.opens` could even open (rather than surfacing a self-contradictory posting).

### Conventions

- **Imports.** Use package-relative imports within a package (`from .read import read`) and
  absolute imports across packages (`import pipeline` from `sources`). Never manipulate
  `sys.path` or rely on the CWD — the editable install makes the packages importable everywhere.
- **Data files.** Load package data via `importlib.resources.files(__package__)` (see how
  `pipeline/extract` reads `schema.json`), not bare `open("schema.json")`. Declare new data
  files under `[tool.setuptools.package-data]` in `pyproject.toml`.

## `experiments/` — external validation harness

Lives at the repo root, outside `findmypredoc/`, and consumes the package the same way any
external caller would (via the editable install) — it does not import from within the package
itself. Run scripts here with the same venv used for the package:

```sh
.venv.dev/Scripts/python.exe experiments/one_source_test.py
```

- **`one_source_test.py`** — runs a single source (currently `sources.predoc`) end-to-end
  (fetch -> read -> extract) against every live posting URL and reports success/failure
  counts broken down by the four read pathways (`website`, `pdf`, `docx`,
  `google_drive_file`). Uses `claude-haiku-4-5` (not the package's default extraction model)
  to keep the cost of walking every posting down, since it hits the live network and the
  Anthropic API for each URL. Writes the full per-URL results (extracted `position` data or
  error) plus a per-pathway summary to `results.json` alongside the script (overwritten on
  each run, gitignored).

## `service/` — daily ingestion job

`run_pipeline.py` is the job that refreshes the Neon database: for each of the four sources,
upserts a `source` row (matched by name), fetches its posting URLs, skips any URL already in
`predoc` (has any row at all, error or not — postings are assumed permanent, so a prior
failure is never retried by default), and for the rest runs `pipeline.read` + `pipeline.extract`
and inserts a row (`error IS NULL` with the extracted fields on success, or `error` set to
`"READ: ..."` / `"EXTRACT: ..."` — the latter also covering the extraction schema's own
validation errors — with all other fields null, so a failure can be traced to the reader or
the LLM). `predoc.id` / `source.id` are DB-generated (`gen_random_uuid()` default) and
`predoc.url` is unique, so the insert is an upsert (`ON CONFLICT (url) DO UPDATE`), which also
lets `--overwrite-where`/`--from-db` reprocess specific rows in place (see the script's own
`--help`). `predoc` also has six generated columns -- `pos_starts_earliest/latest`,
`app_opens_earliest/latest`, `app_closes_earliest/latest` -- computed from the free-text date
fields by `fuzzy_date_earliest`/`fuzzy_date_latest` SQL functions (see
`service/schema/date_columns.sql`, idempotent, mirrors `api/app/dates.py`'s parsing). These
make data-quality auditing a plain query, e.g. `WHERE pos_starts_latest < app_opens_earliest`
finds postings whose start date predates the application window (the same check
`pipeline.extract` now runs post-extraction, see above). Tracks and reports running LLM cost
(`PRICING_PER_MILLION_TOKENS`) in the `tqdm` progress bar.

Run manually today (`.venv.dev/Scripts/python.exe service/run_pipeline.py`); not yet wired to
a scheduler (see `service/README.md` for the undecided hosting mechanism). Neon connection
info lives in `service/.env.local` (gitignored; pulled via `neonctl env pull`, see
`service/README.md`) and the `.neon` context file at the repo root (safe to commit — no
secrets).

## `api/` — read-only query API

A FastAPI app (`api/app/`) over the same Neon tables `service/` populates, mounted entirely
under `/api/*` (see `api/app/server.py` — this matches how the Vercel Services rewrite
forwards paths, with the `/api` prefix intact). See `api/README.md` for the full
endpoint/filter reference. Notable design point: `pos_starts` / `app_opens` / `app_closes`
are free-text dates from the extraction schema (exact day, month, or season) —
`api/app/dates.py` parses each into an `(earliest, latest)` range at query time so they can
be ordered and range-filtered consistently regardless of precision, without needing schema
changes to the `predoc` table.

## `app/` — frontend

A Next.js (App Router) app: a single filterable/sortable table of postings, plus an About
page. See `app/README.md`. Talks to `api/` via a Vercel service binding (`API_URL`) rather
than a public URL — see the repo-root `vercel.json`. Filter/sort state lives entirely in the
URL's search params; the main page (`app/src/app/page.tsx`) is a Server Component that reads
them and re-fetches on the server, so there's no client-side fetch/loading-state code to
maintain.

## Deployment (Vercel Services)

`api/` and `app/` deploy together as one Vercel project (`findmypredoc`) via the repo-root
`vercel.json`'s `services` config — see [Services](https://vercel.com/docs/services). The
project's Root Directory setting must be the repo root (not a subdirectory) for this to
work, since the config references both `app/` and `api/` as sibling service roots. Public
routing: `/api/*` → the `api` service, everything else → the `app` service (top-level
`rewrites`). `findmypredoc/`, `experiments/`, and `service/` aren't part of this deployment.
