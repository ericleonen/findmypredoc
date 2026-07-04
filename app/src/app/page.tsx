import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import PredocCards from "@/components/PredocCards";
import Pagination from "@/components/Pagination";
import { fetchPredocs, type ApplicationStatus } from "@/lib/api";

type SearchParams = Promise<{
  application_status?: string | string[];
  institution?: string;
  sort?: string;
  offset?: string;

  title?: string;
  location?: string;
  source_name?: string;
  min_letters_of_recommendation?: string;
  max_letters_of_recommendation?: string;
  writing_sample?: string;
  starts_after?: string;
  starts_before?: string;
  opens_after?: string;
  opens_before?: string;
  closes_after?: string;
  closes_before?: string;
}>;

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

const LIMIT = 50;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const offset = Number(params.offset ?? 0) || 0;

  const predocs = await fetchPredocs({
    application_status: toArray(params.application_status) as ApplicationStatus[],
    search: params.institution,
    sort: params.sort,
    limit: LIMIT,
    offset,

    title: params.title,
    location: params.location,
    source_name: params.source_name,
    min_letters_of_recommendation: params.min_letters_of_recommendation
      ? Number(params.min_letters_of_recommendation)
      : undefined,
    max_letters_of_recommendation: params.max_letters_of_recommendation
      ? Number(params.max_letters_of_recommendation)
      : undefined,
    writing_sample: params.writing_sample ? params.writing_sample === "true" : undefined,
    starts_after: params.starts_after,
    starts_before: params.starts_before,
    opens_after: params.opens_after,
    opens_before: params.opens_before,
    closes_after: params.closes_after,
    closes_before: params.closes_before,
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 pb-16">
      <Suspense>
        <FilterBar />
      </Suspense>
      <PredocCards items={predocs.items} />
      <Suspense>
        <Pagination total={predocs.total} limit={predocs.limit} offset={predocs.offset} />
      </Suspense>
    </div>
  );
}
