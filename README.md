# findmypredoc

Find My Predoc scrapes pre-doctoral research-assistant ("predoc") job listings from
aggregator sources (NBER, Econ Job Market, PREDOC.org), reads each posting (web page, PDF,
DOCX, or Google Drive file), and uses the Anthropic API to extract structured fields such as
institution, application deadlines, and requirements. A daily job upserts the results into a
Postgres database, which a read-only API serves to a filterable web frontend.

## Recent postings

<!-- RECENT_POSTINGS:START -->
- **University of California, Berkeley** — [Junior Specialist or Assistant Specialist](https://aprecruit.berkeley.edu/JPF05554)
- **Yale University** — [Predoctoral Fellow](https://tobin.yale.edu/opportunities/research-health-care-us-1)
- **Yale University** — [Predoctoral Fellow](https://tobin.yale.edu/opportunities/economics-safety-net-0)
- **Yale University** — [Predoctoral Research Assistant](https://tobin.yale.edu/opportunities/supporting-research-economics-children-and-families)
- **National Bureau of Economic Research** — [Full Time Research Assistant](https://bit.ly/4ypqwpM)
<!-- RECENT_POSTINGS:END -->

<!-- LAST_RAN:START -->
Last ran: 2026-10-19 18:43 UTC
<!-- LAST_RAN:END -->

*(Updated automatically by the daily ingestion job — see `.github/workflows/ingest.yml`.)*

## Structure

- **`findmypredoc/`** — the Python scraping/extraction package (sources + read/extract pipeline).
- **`experiments/`** — scratch scripts that exercise `findmypredoc` end-to-end against live data.
- **`service/`** — the daily ingestion job that refreshes the database.
- **`api/`** — a read-only FastAPI service over the database.
- **`app/`** — the Next.js frontend.

See `CLAUDE.md` and each subdirectory's own `README.md` for setup and implementation details.
