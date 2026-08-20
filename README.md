# findmypredoc

Find My Predoc scrapes pre-doctoral research-assistant ("predoc") job listings from
aggregator sources (NBER, Econ Job Market, PREDOC.org), reads each posting (web page, PDF,
DOCX, or Google Drive file), and uses the Anthropic API to extract structured fields such as
institution, application deadlines, and requirements. A daily job upserts the results into a
Postgres database, which a read-only API serves to a filterable web frontend.

## Recent postings

<!-- RECENT_POSTINGS:START -->
- **University of Chicago** — [Research Associate](https://apply.interfolio.com/190379)
- **Wesleyan University** — [Lab Coordinator](https://bit.ly/4zffhBQ)
- **University of Chicago Booth School of Business** — [Research Professional](https://www.chicagobooth.edu/-/media/faculty/research-professional-program/job-ads/2026-27/ganongnoelad2026v20260724docx.pdf)
- **Council of Economic Advisers** — [Research Assistant](https://bit.ly/4i7nn9t)
- **University of California, Berkeley** — [Junior Specialist or Assistant Specialist](https://bit.ly/3SpDipi)
<!-- RECENT_POSTINGS:END -->

<!-- LAST_RAN:START -->
Last ran: 2026-08-20 13:10 UTC
<!-- LAST_RAN:END -->

*(Updated automatically by the daily ingestion job — see `.github/workflows/ingest.yml`.)*

## Structure

- **`findmypredoc/`** — the Python scraping/extraction package (sources + read/extract pipeline).
- **`experiments/`** — scratch scripts that exercise `findmypredoc` end-to-end against live data.
- **`service/`** — the daily ingestion job that refreshes the database.
- **`api/`** — a read-only FastAPI service over the database.
- **`app/`** — the Next.js frontend.

See `CLAUDE.md` and each subdirectory's own `README.md` for setup and implementation details.
