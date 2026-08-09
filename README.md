# findmypredoc

Find My Predoc scrapes pre-doctoral research-assistant ("predoc") job listings from
aggregator sources (NBER, Econ Job Market, PREDOC.org), reads each posting (web page, PDF,
DOCX, or Google Drive file), and uses the Anthropic API to extract structured fields such as
institution, application deadlines, and requirements. A daily job upserts the results into a
Postgres database, which a read-only API serves to a filterable web frontend.

## Recent postings

<!-- RECENT_POSTINGS:START -->
- **University of Chicago** — [Research Professional](https://bit.ly/4wEZ5bt)
- **Massachusetts Institute of Technology** — [Pre-Doctoral Researcher](https://www.nber.org/sites/default/files/2026-08/2027%20MIT%20RA%20opportunity%20with%20Prof.%20Finkelstein.pdf)
- **Harvard Business School** — [Research Associate (General)](https://bit.ly/4pUpU9a)
- **Harvard Business School** — [Research Associate (General)](https://bit.ly/4yz1mX4)
- **Harvard Business School** — [Manager, Project on Impact Investing](https://careers.harvard.edu/job/manager-project-on-impact-investing-in-boston-ma-united-states-jid-1790)
<!-- RECENT_POSTINGS:END -->

<!-- LAST_RAN:START -->
Last ran: 2026-08-09 13:16 UTC
<!-- LAST_RAN:END -->

*(Updated automatically by the daily ingestion job — see `.github/workflows/ingest.yml`.)*

## Structure

- **`findmypredoc/`** — the Python scraping/extraction package (sources + read/extract pipeline).
- **`experiments/`** — scratch scripts that exercise `findmypredoc` end-to-end against live data.
- **`service/`** — the daily ingestion job that refreshes the database.
- **`api/`** — a read-only FastAPI service over the database.
- **`app/`** — the Next.js frontend.

See `CLAUDE.md` and each subdirectory's own `README.md` for setup and implementation details.
