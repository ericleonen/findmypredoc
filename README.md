# findmypredoc

Find My Predoc scrapes pre-doctoral research-assistant ("predoc") job listings from
aggregator sources (NBER, Econ Job Market, PREDOC.org), reads each posting (web page, PDF,
DOCX, or Google Drive file), and uses the Anthropic API to extract structured fields such as
institution, application deadlines, and requirements. A daily job upserts the results into a
Postgres database, which a read-only API serves to a filterable web frontend.

## Recent postings

<!-- RECENT_POSTINGS:START -->
- **National Bureau of Economic Research** — [Full Time Research Assistant](https://bit.ly/4ypqwpM)
- **University of Chicago Booth School of Business** — [Research Professional](https://www.chicagobooth.edu/-/media/faculty/research-professional-program/job-ads/2026-27/leuz-stewart-ad-2026.pdf)
- **University of Chicago Booth School of Business** — [Research Professional](https://bit.ly/4yRfRoK)
- **University of Chicago** — [Full Time Research Assistant](https://workforcenow.adp.com/mascsr/default/mdf/recruitment/recruitment.html?cid=62bc21f7-1c83-4bca-8f15-c70a9edae2c5&ccId=19000101_000001&jobId=959541&source=CC2&lang=en_US)
- **Columbia University** — [Research Staff Associate](https://apply.interfolio.com/195145)
<!-- RECENT_POSTINGS:END -->

<!-- LAST_RAN:START -->
Last ran: 2026-10-18 15:52 UTC
<!-- LAST_RAN:END -->

*(Updated automatically by the daily ingestion job — see `.github/workflows/ingest.yml`.)*

## Structure

- **`findmypredoc/`** — the Python scraping/extraction package (sources + read/extract pipeline).
- **`experiments/`** — scratch scripts that exercise `findmypredoc` end-to-end against live data.
- **`service/`** — the daily ingestion job that refreshes the database.
- **`api/`** — a read-only FastAPI service over the database.
- **`app/`** — the Next.js frontend.

See `CLAUDE.md` and each subdirectory's own `README.md` for setup and implementation details.
