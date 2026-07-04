"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  total,
  limit,
  offset,
}: {
  total: number;
  limit: number;
  offset: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.floor(offset / limit) + 1;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  const goTo = (newOffset: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newOffset > 0) params.set("offset", String(newOffset));
    else params.delete("offset");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm font-semibold text-ink/60">
        Showing {total === 0 ? 0 : offset + 1}–{Math.min(offset + limit, total)} of {total} postings
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => goTo(Math.max(0, offset - limit))}
          disabled={!hasPrev}
          className="flex items-center gap-1 rounded-md border-2 border-ink bg-paper px-3 py-1.5 text-sm font-bold shadow-brutal-sm press-brutal disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none enabled:hover:bg-mint-100"
        >
          <ChevronLeft size={15} strokeWidth={2} />
          Prev
        </button>
        <span className="px-2 text-sm font-semibold text-ink/60">
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => goTo(offset + limit)}
          disabled={!hasNext}
          className="flex items-center gap-1 rounded-md border-2 border-ink bg-paper px-3 py-1.5 text-sm font-bold shadow-brutal-sm press-brutal disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none enabled:hover:bg-mint-100"
        >
          Next
          <ChevronRight size={15} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
