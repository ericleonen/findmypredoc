# findmypredoc

Find My Predoc scrapes pre-doctoral research-assistant ("predoc") job listings from
aggregator sources (NBER, Econ Job Market, PREDOC.org), reads each posting (web page, PDF,
DOCX, or Google Drive file), and uses the Anthropic API to extract structured fields such as
institution, application deadlines, and requirements. A daily job upserts the results into a
Postgres database, which a read-only API serves to a filterable web frontend.

## Recent postings

<!-- RECENT_POSTINGS:START -->
- **Massachusetts Institute of Technology** — [Pre-doctoral Researcher - Technical Associate](https://bit.ly/4AGEW74)
- **Harvard University** — [Predoctoral Research Associate](https://bit.ly/3Vn96MG)
- **Stanford Institute for Economic Policy Research (SIEPR)** — [SIEPR Predoctoral Research Fellow](https://bit.ly/4xVMGQh)
- **Harvard University** — [Predoctoral Research Associate](https://jobs.smartrecruiters.com/HarvardUniversity/3743990015267096-predoctoral-research-associate-summer-2027-)
- **Stanford Institute for Economic Policy Research (SIEPR)** — [SIEPR Predoctoral Research Fellow](https://siepr.stanford.edu/programs/siepr-predoctoral-research-fellows-program/apply-siepr-predoctoral-research-fellows)
<!-- RECENT_POSTINGS:END -->

<!-- LAST_RAN:START -->
Last ran: 2026-09-30 18:01 UTC
<!-- LAST_RAN:END -->

*(Updated automatically by the daily ingestion job — see `.github/workflows/ingest.yml`.)*

## Structure

- **`findmypredoc/`** — the Python scraping/extraction package (sources + read/extract pipeline).
- **`experiments/`** — scratch scripts that exercise `findmypredoc` end-to-end against live data.
- **`service/`** — the daily ingestion job that refreshes the database.
- **`api/`** — a read-only FastAPI service over the database.
- **`app/`** — the Next.js frontend.

See `CLAUDE.md` and each subdirectory's own `README.md` for setup and implementation details.
