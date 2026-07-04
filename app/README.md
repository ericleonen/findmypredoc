# app

The Next.js frontend for findmypredoc — a filterable table of predoc postings served by
`api/`. Deployed together with `api/` as a single Vercel project via
[Services](https://vercel.com/docs/services) (see the repo-root `vercel.json`).

## Running locally

Because the app talks to `api/` via a Vercel service binding (`API_URL`, injected only at
deploy time), the two services need to run together to work exactly as they do in
production. From the repo root:

```sh
vercel dev
```

To develop the frontend alone against a locally-running FastAPI instance instead (see
`api/README.md`), set `NEXT_PUBLIC_API_URL` to that instance's URL (defaults to
`http://127.0.0.1:8000`) and run the plain Next.js dev server from this directory:

```sh
npm run dev
```

## Structure

- `src/app/page.tsx` — the main table page. A Server Component that reads `searchParams`
  (application status, institution search, sort) and fetches `/api/predocs` accordingly —
  filtering/sorting works by pushing new search params to the URL and letting Next.js
  re-render server-side, no client-side fetch/loading state needed.
- `src/app/about/page.tsx` — the About page.
- `src/components/FilterBar.tsx` — the icon-based filter/sort controls (Client Component).
- `src/components/PredocTable.tsx` — the table itself, including the application-status badge.
- `src/components/Footer.tsx` — site footer (links to GitHub, the repo, API docs, About).
- `src/lib/api.ts` — typed fetch helper + response types matching `api/app/schemas.py`.
