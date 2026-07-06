import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import PredocCards from "@/components/PredocCards";
import Pagination from "@/components/Pagination";
import { fetchPredocs, fetchSources, type ApplicationStatus } from "@/lib/api";

type SearchParams = Promise<{
  application_status?: string | string[];
  institution?: string;
  sort?: string;
  offset?: string;
  allow_closed?: string;
  allow_unknown?: string;

  title?: string;
  location?: string;
  source_name?: string;
  max_letters_of_recommendation?: string;
  writing_sample?: string;
  starts_after?: string;
}>;

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

const LIMIT = 50;

// Closed/likely-closed and unknown-status postings are hidden by default (see the
// "Allow closed" / "Allow unknown status" advanced filters) unless the user has
// explicitly toggled a specific status to view.
function resolveApplicationStatus(params: Awaited<SearchParams>): ApplicationStatus[] {
  const toggles = toArray(params.application_status) as ApplicationStatus[];
  if (toggles.length > 0) return toggles;

  const statuses: ApplicationStatus[] = ["open", "upcoming"];
  if (params.allow_closed === "true") statuses.push("likely_closed", "closed");
  if (params.allow_unknown === "true") statuses.push("unknown");
  return statuses;
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const offset = Number(params.offset ?? 0) || 0;

  const [predocs, sources] = await Promise.all([
    fetchPredocs({
      application_status: resolveApplicationStatus(params),
      search: params.institution,
      sort: params.sort,
      limit: LIMIT,
      offset,

      title: params.title,
      location: params.location,
      source_name: params.source_name,
      max_letters_of_recommendation: params.max_letters_of_recommendation
        ? Number(params.max_letters_of_recommendation)
        : undefined,
      writing_sample: params.writing_sample ? params.writing_sample === "true" : undefined,
      starts_after: params.starts_after,
    }),
    fetchSources(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 pb-16">
      <Suspense>
        <FilterBar sources={sources.map((s) => s.name)} />
      </Suspense>
      <PredocCards items={predocs.items} />
      <Suspense>
        <Pagination total={predocs.total} limit={predocs.limit} offset={predocs.offset} />
      </Suspense>
    </div>
  );
}
