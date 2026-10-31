# findmypredoc

Find My Predoc scrapes pre-doctoral research-assistant ("predoc") job listings from
aggregator sources (NBER, Econ Job Market, PREDOC.org), reads each posting (web page, PDF,
DOCX, or Google Drive file), and uses the Anthropic API to extract structured fields such as
institution, application deadlines, and requirements. A daily job upserts the results into a
Postgres database, which a read-only API serves to a filterable web frontend.

## Recent postings

<!-- RECENT_POSTINGS:START -->
- **California Institute of Technology** — [Research Technician-Assistant](https://bit.ly/47JcKU6)
- **foundry10** — [Economics Research Assistant](https://econjobmarket.org/positions/12952)
- **University of Pennsylvania** — [Pre-Doctoral Research Specialist (Real Estate Center)](https://wd1.myworkdaysite.com/recruiting/upenn/Wharton/job/Dinan-Hall---4th-Floor/Pre-Doctoral-Research-Specialist--Real-Estate-Center-_JR00124462)
- **Dartmouth College** — [Economic Research Specialist in Behavioral Economics and Finance](https://apply.interfolio.com/196307)
- **Georgetown University** — [Economics Pre-Doctoral Fellowship](https://www.nber.org/sites/default/files/2026-10/Ji%20PreDoc%20Ad%202026.pdf)
<!-- RECENT_POSTINGS:END -->

<!-- LAST_RAN:START -->
Last ran: 2026-10-31 17:15 UTC
<!-- LAST_RAN:END -->

*(Updated automatically by the daily ingestion job — see `.github/workflows/ingest.yml`.)*

## Structure

- **`findmypredoc/`** — the Python scraping/extraction package (sources + read/extract pipeline).
- **`experiments/`** — scratch scripts that exercise `findmypredoc` end-to-end against live data.
- **`service/`** — the daily ingestion job that refreshes the database.
- **`api/`** — a read-only FastAPI service over the database.
- **`app/`** — the Next.js frontend.

See `CLAUDE.md` and each subdirectory's own `README.md` for setup and implementation details.
