import { ExternalLink } from "lucide-react";
import type { Predoc, ApplicationStatus } from "@/lib/api";

const STATUS_STYLES: Record<ApplicationStatus, { label: string; dot: string; text: string }> = {
  open: { label: "Open", dot: "bg-mint-500", text: "text-mint-600" },
  upcoming: { label: "Upcoming", dot: "bg-amber-500", text: "text-amber-700" },
  closed: { label: "Closed", dot: "bg-ink/30", text: "text-ink/40" },
  unknown: { label: "Unknown", dot: "bg-ink/30", text: "text-ink/40" },
};

function StatusBadge({ predoc }: { predoc: Predoc }) {
  const style = STATUS_STYLES[predoc.application_status];
  const detail =
    predoc.application_status === "open"
      ? predoc.closes && `closes ${predoc.closes}`
      : predoc.application_status === "upcoming"
        ? predoc.opens && `opens ${predoc.opens}`
        : null;

  return (
    <div className="flex flex-col gap-0.5">
      <span className={`flex items-center gap-1.5 text-sm font-bold ${style.text}`}>
        <span className={`h-2 w-2 rounded-full border border-ink/20 ${style.dot}`} />
        {style.label}
      </span>
      {detail && <span className="text-xs text-ink/50">{detail}</span>}
    </div>
  );
}

export default function PredocTable({ items }: { items: Predoc[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border-2 border-ink bg-paper py-24 text-center shadow-brutal">
        <p className="text-lg font-bold">No postings match your filters.</p>
        <p className="text-sm text-ink/50">Try widening your search.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border-2 border-ink bg-paper shadow-brutal">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b-2 border-ink bg-mint-200 text-xs font-bold uppercase tracking-wide text-ink">
            <th className="px-5 py-3">Position</th>
            <th className="px-5 py-3">Location</th>
            <th className="px-5 py-3">Starts</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-ink/10">
          {items.map((predoc) => (
            <tr key={predoc.id} className="group hover:bg-mint-50 transition-colors">
              <td className="px-5 py-4 align-top">
                <div className="font-bold text-ink">
                  {predoc.institution ?? "Unknown institution"}
                </div>
                {predoc.title && <div className="text-ink/60">{predoc.title}</div>}
              </td>
              <td className="px-5 py-4 align-top text-ink/70">{predoc.location ?? "—"}</td>
              <td className="px-5 py-4 align-top text-ink/70">{predoc.starts ?? "—"}</td>
              <td className="px-5 py-4 align-top">
                <StatusBadge predoc={predoc} />
              </td>
              <td className="px-5 py-4 align-top text-right">
                <a
                  href={predoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded border-2 border-transparent p-1 text-ink/50 opacity-0 transition-opacity group-hover:opacity-100 hover:border-ink hover:bg-mint-200 hover:text-ink"
                  aria-label={`Open posting for ${predoc.institution ?? "this position"}`}
                >
                  <ExternalLink size={16} strokeWidth={2} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
