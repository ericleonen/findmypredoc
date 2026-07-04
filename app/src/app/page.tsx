import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import PredocTable from "@/components/PredocTable";
import { fetchPredocs, type ApplicationStatus } from "@/lib/api";

type SearchParams = Promise<{
  application_status?: string | string[];
  institution?: string;
  sort?: string;
}>;

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const predocs = await fetchPredocs({
    application_status: toArray(params.application_status) as ApplicationStatus[],
    search: params.institution,
    sort: params.sort,
    limit: 100,
  });

  return (
    <div className="mx-auto max-w-4xl px-6 pb-16">
      <Suspense>
        <FilterBar />
      </Suspense>
      <PredocTable items={predocs.items} />
      <p className="mt-4 text-center text-xs text-stone-400">
        Showing {predocs.items.length} of {predocs.total} postings
      </p>
    </div>
  );
}
