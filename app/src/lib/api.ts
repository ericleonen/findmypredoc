export type ApplicationStatus = "open" | "upcoming" | "closed" | "unknown";

export type Predoc = {
  id: string;
  source_id: string | null;
  source_name: string | null;
  url: string;

  institution: string | null;
  title: string | null;
  location: string | null;
  length: string | null;
  letters_of_recommendation: number | null;
  writing_sample: boolean | null;

  starts: string | null;
  starts_earliest: string | null;
  starts_latest: string | null;

  opens: string | null;
  opens_earliest: string | null;
  opens_latest: string | null;

  closes: string | null;
  closes_earliest: string | null;
  closes_latest: string | null;

  application_status: ApplicationStatus;
};

export type PredocList = {
  total: number;
  limit: number;
  offset: number;
  items: Predoc[];
};

export type PredocFilters = {
  application_status?: ApplicationStatus[];
  search?: string;
  sort?: string;
  offset?: number;
  limit?: number;

  // Advanced filters
  title?: string;
  location?: string;
  source_name?: string;
  min_letters_of_recommendation?: number;
  max_letters_of_recommendation?: number;
  writing_sample?: boolean;
  starts_after?: string;
  starts_before?: string;
  opens_after?: string;
  opens_before?: string;
  closes_after?: string;
  closes_before?: string;
};

/**
 * Base URL for reaching the `api` service. In production this is the internal
 * service binding (see vercel.json); locally it falls back to `NEXT_PUBLIC_API_URL`
 * (set when running the Next.js dev server standalone, without `vercel dev`).
 */
function apiBaseUrl(): string {
  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
}

export async function fetchPredocs(filters: PredocFilters): Promise<PredocList> {
  const params = new URLSearchParams();

  for (const status of filters.application_status ?? []) {
    params.append("application_status", status);
  }
  if (filters.search) {
    // The API doesn't have a single "search" param -- this searches institution and
    // title together, since that's what a free-text search box implies to a user.
    params.append("institution", filters.search);
  }
  if (filters.title) params.set("title", filters.title);
  if (filters.location) params.set("location", filters.location);
  if (filters.source_name) params.set("source_name", filters.source_name);
  if (filters.min_letters_of_recommendation !== undefined) {
    params.set("min_letters_of_recommendation", String(filters.min_letters_of_recommendation));
  }
  if (filters.max_letters_of_recommendation !== undefined) {
    params.set("max_letters_of_recommendation", String(filters.max_letters_of_recommendation));
  }
  if (filters.writing_sample !== undefined) {
    params.set("writing_sample", String(filters.writing_sample));
  }
  if (filters.starts_after) params.set("starts_after", filters.starts_after);
  if (filters.starts_before) params.set("starts_before", filters.starts_before);
  if (filters.opens_after) params.set("opens_after", filters.opens_after);
  if (filters.opens_before) params.set("opens_before", filters.opens_before);
  if (filters.closes_after) params.set("closes_after", filters.closes_after);
  if (filters.closes_before) params.set("closes_before", filters.closes_before);

  params.set("sort", filters.sort ?? "recommended");
  params.set("limit", String(filters.limit ?? 50));
  params.set("offset", String(filters.offset ?? 0));

  const res = await fetch(new URL(`/api/predocs?${params}`, apiBaseUrl()), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch predocs: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
