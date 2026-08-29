# findmypredoc

Find My Predoc scrapes pre-doctoral research-assistant ("predoc") job listings from
aggregator sources (NBER, Econ Job Market, PREDOC.org), reads each posting (web page, PDF,
DOCX, or Google Drive file), and uses the Anthropic API to extract structured fields such as
institution, application deadlines, and requirements. A daily job upserts the results into a
Postgres database, which a read-only API serves to a filterable web frontend.

## Recent postings

<!-- RECENT_POSTINGS:START -->
- **Federal Reserve Bank of New York** — [Research Analyst](https://bit.ly/4y6hHBr)
- **Dartmouth College** — [Economics Research Specialist](https://bit.ly/4hUxzSR)
- **University of Pennsylvania** — [Pre-Doctoral Research Specialist (Real Estate Center)](https://urldefense.com/v3/__https://wd1.myworkdaysite.com/recruiting/upenn/Wharton/job/Dinan-Hall---4th-Floor/Pre-Doctoral-Research-Specialist--Real-Estate-Center-_JR00124462__;!!IBzWLUs!VM4yYzh0aGnUVmMRA_zEMu9fd3_arztGVW53NT7Ou5K7liz3IoVVbJiCd0TsKwQDkYbg_BUl6E6Q2kAYWV_7_LJaH-gbn7Q$)
- **The University of Chicago Booth School of Business** — [Research Assistant](https://www.chicagobooth.edu/-/media/faculty/research-professional-program/job-ads/2026-27/budish-rp-ad.pdf)
- **Dartmouth College** — [Economics Research Specialist](https://apply.interfolio.com/192176)
<!-- RECENT_POSTINGS:END -->

<!-- LAST_RAN:START -->
Last ran: 2026-08-29 16:43 UTC
<!-- LAST_RAN:END -->

*(Updated automatically by the daily ingestion job — see `.github/workflows/ingest.yml`.)*

## Structure

- **`findmypredoc/`** — the Python scraping/extraction package (sources + read/extract pipeline).
- **`experiments/`** — scratch scripts that exercise `findmypredoc` end-to-end against live data.
- **`service/`** — the daily ingestion job that refreshes the database.
- **`api/`** — a read-only FastAPI service over the database.
- **`app/`** — the Next.js frontend.

See `CLAUDE.md` and each subdirectory's own `README.md` for setup and implementation details.
