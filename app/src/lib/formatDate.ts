const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * The extraction schema's date fields are free text: an exact day ("2026-08-15"), a month
 * ("September 2026"), or a season ("Summer 2026"). Only the exact-day form needs reformatting
 * -- the others are already plain English.
 */
export function formatFuzzyDate(value: string | null): string | null {
  if (!value) return null;

  const match = ISO_DATE_RE.exec(value);
  if (!match) return value;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export type SmartDate = {
  label: string;
  /** True when the date is within a week (today, "in N days", or "N days ago"). */
  relative: boolean;
};

/**
 * Like formatFuzzyDate, but for exact days within a week of today, renders a relative label
 * ("in 3 days", "2 days ago", "today") instead -- fuzzy month/season values are too imprecise
 * for relative phrasing and are left as plain English.
 */
export function formatDateSmart(value: string | null): SmartDate | null {
  if (!value) return null;

  const match = ISO_DATE_RE.exec(value);
  if (!match) return { label: value, relative: false };

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000);

  if (Math.abs(diffDays) < 7) {
    if (diffDays === 0) return { label: "today", relative: true };
    if (diffDays > 0) return { label: `in ${diffDays} day${diffDays === 1 ? "" : "s"}`, relative: true };
    return { label: `${-diffDays} day${-diffDays === 1 ? "" : "s"} ago`, relative: true };
  }

  return {
    label: date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    relative: false,
  };
}
