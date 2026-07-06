"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CircleDot, Clock, ArrowUpDown, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useState, useTransition, type ComponentType } from "react";
import type { ApplicationStatus } from "@/lib/api";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { value: "open", label: "Open", icon: CircleDot },
  { value: "upcoming", label: "Upcoming", icon: Clock },
];

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "starts", label: "Starts soonest" },
  { value: "closes", label: "Closes soonest" },
  { value: "institution", label: "Institution (A-Z)" },
];

const ADVANCED_PARAM_KEYS = [
  "institution",
  "title",
  "location",
  "source_name",
  "max_letters_of_recommendation",
  "writing_sample",
  "starts_after",
  "allow_closed",
  "allow_unknown",
];

const inputClass =
  "w-full rounded-md border-2 border-ink bg-paper px-3 py-1.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-mint-500";

export default function FilterBar({ sources }: { sources: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const hasAdvancedInUrl = ADVANCED_PARAM_KEYS.some((key) => searchParams.get(key));
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedInUrl);

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

  const changeSort = (value: string) => {
    updateParams((params) => {
      if (value === "recommended") params.delete("sort");
      else params.set("sort", value);
    });
  };

  const setAdvancedField = (key: string, value: string) => {
    updateParams((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  };

  const clearAdvanced = () => {
    updateParams((params) => {
      ADVANCED_PARAM_KEYS.forEach((key) => params.delete(key));
    });
  };

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = activeStatuses.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleStatus(value)}
                aria-pressed={active}
                className={`flex items-center gap-1.5 rounded-md border-2 border-ink px-3 py-1.5 text-sm font-semibold press-brutal ${
                  active ? "bg-mint-400 shadow-brutal-sm" : "bg-paper hover:bg-mint-100 shadow-brutal-sm"
                }`}
              >
                <Icon size={14} strokeWidth={2} />
                {label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-pressed={showAdvanced}
            className={`flex items-center gap-1.5 rounded-md border-2 border-ink px-3 py-1.5 text-sm font-semibold press-brutal ${
              showAdvanced ? "bg-ink text-paper shadow-brutal-sm" : "bg-paper hover:bg-mint-100 shadow-brutal-sm"
            }`}
          >
            <SlidersHorizontal size={14} strokeWidth={2} />
            Advanced
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <ArrowUpDown
              size={14}
              strokeWidth={2}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/50"
            />
            <select
              value={searchParams.get("sort") ?? "recommended"}
              onChange={(e) => changeSort(e.target.value)}
              className={`${inputClass} min-w-[11rem] appearance-none pl-8 shadow-brutal-sm`}
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

      {showAdvanced && (
        <div className="rounded-md border-2 border-ink bg-mint-50 p-4 shadow-brutal-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wide text-ink/70">
              Advanced filters
            </h3>
            <button
              type="button"
              onClick={clearAdvanced}
              className="flex items-center gap-1 text-xs font-semibold text-ink/60 hover:text-ink"
            >
              <X size={13} strokeWidth={2} />
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-ink/60">
              Institution contains
              <input
                type="text"
                defaultValue={searchParams.get("institution") ?? ""}
                onBlur={(e) => setAdvancedField("institution", e.target.value)}
                className={inputClass}
                placeholder="e.g. MIT"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-ink/60">
              Title contains
              <input
                type="text"
                defaultValue={searchParams.get("title") ?? ""}
                onBlur={(e) => setAdvancedField("title", e.target.value)}
                className={inputClass}
                placeholder="e.g. research assistant"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-ink/60">
              Location contains
              <input
                type="text"
                defaultValue={searchParams.get("location") ?? ""}
                onBlur={(e) => setAdvancedField("location", e.target.value)}
                className={inputClass}
                placeholder="e.g. remote, Boston"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-ink/60">
              Source
              <select
                defaultValue={searchParams.get("source_name") ?? ""}
                onChange={(e) => setAdvancedField("source_name", e.target.value)}
                className={inputClass}
              >
                <option value="">Any source</option>
                {sources.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-ink/60">
              Max letters of recommendation
              <input
                type="number"
                min={0}
                defaultValue={searchParams.get("max_letters_of_recommendation") ?? ""}
                onBlur={(e) => setAdvancedField("max_letters_of_recommendation", e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-ink/60">
              Writing sample
              <select
                defaultValue={searchParams.get("writing_sample") ?? ""}
                onChange={(e) => setAdvancedField("writing_sample", e.target.value)}
                className={inputClass}
              >
                <option value="">Any</option>
                <option value="true">Required</option>
                <option value="false">Not required</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-ink/60">
              Starts after
              <input
                type="date"
                defaultValue={searchParams.get("starts_after") ?? ""}
                onChange={(e) => setAdvancedField("starts_after", e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink/60 sm:col-span-2 lg:col-span-3">
              <input
                type="checkbox"
                checked={searchParams.get("allow_closed") === "true"}
                onChange={(e) => setAdvancedField("allow_closed", e.target.checked ? "true" : "")}
                className="h-4 w-4 accent-mint-500"
              />
              Allow closed postings
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink/60 sm:col-span-2 lg:col-span-3">
              <input
                type="checkbox"
                checked={searchParams.get("allow_unknown") === "true"}
                onChange={(e) => setAdvancedField("allow_unknown", e.target.checked ? "true" : "")}
                className="h-4 w-4 accent-mint-500"
              />
              Allow postings with unknown application status
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
