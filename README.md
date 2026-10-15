# findmypredoc

Find My Predoc scrapes pre-doctoral research-assistant ("predoc") job listings from
aggregator sources (NBER, Econ Job Market, PREDOC.org), reads each posting (web page, PDF,
DOCX, or Google Drive file), and uses the Anthropic API to extract structured fields such as
institution, application deadlines, and requirements. A daily job upserts the results into a
Postgres database, which a read-only API serves to a filterable web frontend.

## Recent postings

<!-- RECENT_POSTINGS:START -->
- **Columbia University** — [Research Staff Associate](https://apply.interfolio.com/195145)
- **University of Chicago Booth School of Business** — [Research Professional](https://uchicago.wd5.myworkdayjobs.com/External/job/Chicago-IL/Research-Professional_JR34816)
- **Federal Reserve Bank of Chicago** — [Research Assistant](https://bit.ly/4zxzQIX)
- **Yale University** — [Pre-Doctoral Fellow](https://bit.ly/4yAJGJz)
- **University of California, Berkeley** — [Junior Specialist / Assistant Specialist](https://bit.ly/4hZYTxj)
<!-- RECENT_POSTINGS:END -->

<!-- LAST_RAN:START -->
Last ran: 2026-10-15 17:00 UTC
<!-- LAST_RAN:END -->

*(Updated automatically by the daily ingestion job — see `.github/workflows/ingest.yml`.)*

## Structure

- **`findmypredoc/`** — the Python scraping/extraction package (sources + read/extract pipeline).
- **`experiments/`** — scratch scripts that exercise `findmypredoc` end-to-end against live data.
- **`service/`** — the daily ingestion job that refreshes the database.
- **`api/`** — a read-only FastAPI service over the database.
- **`app/`** — the Next.js frontend.

See `CLAUDE.md` and each subdirectory's own `README.md` for setup and implementation details.
