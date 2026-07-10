# findmypredoc

Find My Predoc scrapes pre-doctoral research-assistant ("predoc") job listings from
aggregator sources (NBER, Econ Job Market, PREDOC.org), reads each posting (web page, PDF,
DOCX, or Google Drive file), and uses the Anthropic API to extract structured fields such as
institution, application deadlines, and requirements. A daily job upserts the results into a
Postgres database, which a read-only API serves to a filterable web frontend.

## Recent postings

<!-- RECENT_POSTINGS:START -->
- **Brown University** — [Research Associate](https://bit.ly/4wpM3xR)
- **CEMFI** — [Research Pre-Doctoral Fellow](https://bit.ly/44hatxH)
- **UC Berkeley** — [Predoctoral Research Assistant](https://www.dropbox.com/scl/fi/5tdgie0fmx2b3iwudy2hd/Butera-Lian-Shenhav-Taubinsky-Predoc-Position.pdf?rlkey=ci3j7q5fwn1oj6yas1dkuopye&e=1&st=d5fabubx&dl=0)
- **Northwestern University** — [Research Data Analyst Associate](https://economics.northwestern.edu/people/research-data-analyst-associate-description-for-external-distribution-2024.pdf)
- **World Bank** — [Research Assistant](https://seankhiggins.com/assets/pdf/IDE_ra_call.pdf)
<!-- RECENT_POSTINGS:END -->

<!-- LAST_RAN:START -->
Last ran: 2026-07-10 14:51 UTC
<!-- LAST_RAN:END -->

*(Updated automatically by the daily ingestion job — see `.github/workflows/ingest.yml`.)*

## Structure

- **`findmypredoc/`** — the Python scraping/extraction package (sources + read/extract pipeline).
- **`experiments/`** — scratch scripts that exercise `findmypredoc` end-to-end against live data.
- **`service/`** — the daily ingestion job that refreshes the database.
- **`api/`** — a read-only FastAPI service over the database.
- **`app/`** — the Next.js frontend.

See `CLAUDE.md` and each subdirectory's own `README.md` for setup and implementation details.
