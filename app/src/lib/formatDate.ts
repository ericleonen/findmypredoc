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
