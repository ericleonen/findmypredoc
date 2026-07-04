"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, CircleDot, Clock, CircleOff, ArrowUpDown } from "lucide-react";
import { useCallback, useState, useTransition, type ComponentType, type FormEvent } from "react";
import type { ApplicationStatus } from "@/lib/api";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { value: "open", label: "Open", icon: CircleDot },
  { value: "upcoming", label: "Upcoming", icon: Clock },
  { value: "closed", label: "Closed", icon: CircleOff },
];

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "starts", label: "Starts soonest" },
  { value: "closes", label: "Closes soonest" },
  { value: "institution", label: "Institution (A-Z)" },
];

export default function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("institution") ?? "");

  const activeStatuses = searchParams.getAll("application_status") as ApplicationStatus[];

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete("offset"); // reset pagination whenever filters change
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const toggleStatus = (status: ApplicationStatus) => {
    updateParams((params) => {
      const current = params.getAll("application_status");
      params.delete("application_status");
      const next = current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status];
      next.forEach((s) => params.append("application_status", s));
    });
  };

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    updateParams((params) => {
      if (search) params.set("institution", search);
      else params.delete("institution");
    });
  };

  const changeSort = (value: string) => {
    updateParams((params) => {
      if (value === "recommended") params.delete("sort");
      else params.set("sort", value);
    });
  };

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => {
          const active = activeStatuses.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggleStatus(value)}
              aria-pressed={active}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
              }`}
            >
              <Icon size={14} strokeWidth={2} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <form onSubmit={submitSearch} className="relative">
          <Search
            size={15}
            strokeWidth={1.75}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search institution..."
            className="w-full rounded-full border border-stone-200 bg-white py-1.5 pl-9 pr-3 text-sm text-stone-700 placeholder:text-stone-400 focus:border-teal-700 focus:outline-none sm:w-56"
          />
        </form>

        <div className="relative">
          <ArrowUpDown
            size={14}
            strokeWidth={1.75}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <select
            value={searchParams.get("sort") ?? "recommended"}
            onChange={(e) => changeSort(e.target.value)}
            className="appearance-none rounded-full border border-stone-200 bg-white py-1.5 pl-8 pr-8 text-sm text-stone-600 focus:border-teal-700 focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
