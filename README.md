# findmypredoc

Find My Predoc scrapes pre-doctoral research-assistant ("predoc") job listings from
aggregator sources (NBER, Econ Job Market, PREDOC.org), reads each posting (web page, PDF,
DOCX, or Google Drive file), and uses the Anthropic API to extract structured fields such as
institution, application deadlines, and requirements. A daily job upserts the results into a
Postgres database, which a read-only API serves to a filterable web frontend.

## Recent postings

<!-- RECENT_POSTINGS:START -->
- **University of Notre Dame** — [Predoctoral Research Scholar](https://bit.ly/4rz4sqU)
- **University of Notre Dame** — [Predoctoral Research Scholar](https://bit.ly/4ylZ510)
- **University of Notre Dame** — [Predoctoral Research Scholar](https://bit.ly/4d6kYJ2)
- **University of Notre Dame** — [Predoctoral Research Scholar](https://bit.ly/4hevCzP)
- **Harvard University** — [Pre-Doctoral Fellowship in Behavioral-Economic Theory](https://bit.ly/3VcFTUE)
<!-- RECENT_POSTINGS:END -->

<!-- LAST_RAN:START -->
Last ran: 2026-09-26 16:24 UTC
<!-- LAST_RAN:END -->

*(Updated automatically by the daily ingestion job — see `.github/workflows/ingest.yml`.)*

## Structure

- **`findmypredoc/`** — the Python scraping/extraction package (sources + read/extract pipeline).
- **`experiments/`** — scratch scripts that exercise `findmypredoc` end-to-end against live data.
- **`service/`** — the daily ingestion job that refreshes the database.
- **`api/`** — a read-only FastAPI service over the database.
- **`app/`** — the Next.js frontend.

See `CLAUDE.md` and each subdirectory's own `README.md` for setup and implementation details.
