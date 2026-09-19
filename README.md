# findmypredoc

Find My Predoc scrapes pre-doctoral research-assistant ("predoc") job listings from
aggregator sources (NBER, Econ Job Market, PREDOC.org), reads each posting (web page, PDF,
DOCX, or Google Drive file), and uses the Anthropic API to extract structured fields such as
institution, application deadlines, and requirements. A daily job upserts the results into a
Postgres database, which a read-only API serves to a filterable web frontend.

## Recent postings

<!-- RECENT_POSTINGS:START -->
- **University of Pennsylvania** — [Pre-Doctoral Research Specialist (Real Estate Center)](https://bit.ly/4rti5I7)
- **University of Chicago Booth School of Business** — [Research Professional](https://bit.ly/4h1vW51)
- **Board of Governors of the Federal Reserve System** — [Research Assistant](https://bit.ly/3V0FWCX)
- **University of Chicago Booth School of Business** — [Predoctoral Research Professional](https://bit.ly/4hmfAmu)
- **University of Pennsylvania** — [Predoctoral Research Specialist, Rodney White Center for Financial Research, Wharton School](https://bit.ly/4yJQJzJ)
<!-- RECENT_POSTINGS:END -->

<!-- LAST_RAN:START -->
Last ran: 2026-09-19 15:53 UTC
<!-- LAST_RAN:END -->

*(Updated automatically by the daily ingestion job — see `.github/workflows/ingest.yml`.)*

## Structure

- **`findmypredoc/`** — the Python scraping/extraction package (sources + read/extract pipeline).
- **`experiments/`** — scratch scripts that exercise `findmypredoc` end-to-end against live data.
- **`service/`** — the daily ingestion job that refreshes the database.
- **`api/`** — a read-only FastAPI service over the database.
- **`app/`** — the Next.js frontend.

See `CLAUDE.md` and each subdirectory's own `README.md` for setup and implementation details.
