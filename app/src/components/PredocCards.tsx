import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import type { Predoc, ApplicationStatus } from "@/lib/api";
import { formatFuzzyDate, formatDateSmart } from "@/lib/formatDate";

const STATUS_STYLES: Record<ApplicationStatus, { label: string; dot: string; text: string }> = {
  open: { label: "Open", dot: "bg-mint-500", text: "text-mint-600" },
  upcoming: { label: "Upcoming", dot: "bg-amber-500", text: "text-amber-700" },
  likely_closed: { label: "Likely closed", dot: "bg-orange-500", text: "text-orange-700" },
  closed: { label: "Closed", dot: "bg-ink/30", text: "text-ink/40" },
  unknown: { label: "Unknown", dot: "bg-ink/30", text: "text-ink/40" },
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${style.text}`}>
      <span className={`h-2 w-2 rounded-full border border-ink/20 ${style.dot}`} />
      {style.label}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</span>
      <span className="text-right text-ink/80">{value ?? "—"}</span>
    </div>
  );
}

function startsLine(starts: string | null, length: string | null): string | null {
  const startsLabel = formatFuzzyDate(starts);
  if (startsLabel && length) return `Starts ${startsLabel}, lasts ${length}`;
  if (startsLabel) return `Starts ${startsLabel}`;
  if (length) return `Lasts ${length}`;
  return null;
}

function ApplicationLine({ opens, closes }: { opens: string | null; closes: string | null }) {
  const opensDate = formatDateSmart(opens);
  const closesDate = formatDateSmart(closes);
  if (!opensDate && !closesDate) return null;

  return (
    <div>
      Application{" "}
      {opensDate && (
        <>
          opens{" "}
          <span className={opensDate.relative ? "font-semibold text-mint-600" : undefined}>
            {opensDate.label}
          </span>
        </>
      )}
      {opensDate && closesDate && " and "}
      {closesDate && (
        <>
          closes{" "}
          <span className={closesDate.relative ? "font-semibold text-red-600" : undefined}>
            {closesDate.label}
          </span>
        </>
      )}
    </div>
  );
}

function PredocCard({ predoc }: { predoc: Predoc }) {
  const [primaryLink] = predoc.links;
  const starts = startsLine(predoc.starts, predoc.length);

  return (
    <div className="flex flex-col gap-4 rounded-md border-2 border-ink bg-paper p-5 shadow-brutal sm:flex-row sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <div>
          <div className="text-lg font-bold text-ink">
            {predoc.institution ?? "Unknown institution"}
          </div>
          {predoc.title && <div className="text-ink/60">{predoc.title}</div>}
          {predoc.location && <div className="text-sm text-ink/50">{predoc.location}</div>}
        </div>

        <StatusBadge status={predoc.application_status} />

        <div className="mt-1 flex flex-col gap-0.5 text-sm text-ink/70">
          {starts && <div>{starts}</div>}
          <ApplicationLine opens={predoc.opens} closes={predoc.closes} />
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-56 sm:shrink-0 sm:border-l-2 sm:border-ink/10 sm:pl-4">
        <DetailRow
          label="Source"
          value={
            predoc.source_name &&
            (predoc.source_url ? (
              <a
                href={predoc.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-mint-500 decoration-2 underline-offset-2 hover:bg-mint-100"
              >
                {predoc.source_name}
              </a>
            ) : (
              predoc.source_name
            ))
          }
        />
        <DetailRow
          label="Letters of recommendation"
          value={predoc.letters_of_recommendation !== null ? String(predoc.letters_of_recommendation) : null}
        />
        <DetailRow
          label="Writing sample"
          value={predoc.writing_sample === null ? null : predoc.writing_sample ? "Required" : "Not required"}
        />

        <div className="mt-1 flex items-center gap-2">
          <a
            href={primaryLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md border-2 border-ink bg-mint-200 px-2.5 py-1 text-xs font-bold shadow-brutal-sm press-brutal hover:bg-mint-100"
          >
            <ExternalLink size={13} strokeWidth={2} />
            View posting
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PredocCards({ items }: { items: Predoc[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border-2 border-ink bg-paper py-24 text-center shadow-brutal">
        <p className="text-lg font-bold">No postings match your filters.</p>
        <p className="text-sm text-ink/50">Try widening your search.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((predoc) => (
        <PredocCard key={predoc.id} predoc={predoc} />
      ))}
    </div>
  );
}
