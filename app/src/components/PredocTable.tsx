import { ExternalLink } from "lucide-react";
import type { Predoc, ApplicationStatus } from "@/lib/api";

const STATUS_STYLES: Record<ApplicationStatus, { label: string; dot: string; text: string }> = {
  open: { label: "Open", dot: "bg-emerald-500", text: "text-emerald-700" },
  upcoming: { label: "Upcoming", dot: "bg-amber-500", text: "text-amber-700" },
  closed: { label: "Closed", dot: "bg-stone-300", text: "text-stone-400" },
  unknown: { label: "Unknown", dot: "bg-stone-300", text: "text-stone-400" },
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
      <span className={`flex items-center gap-1.5 text-sm font-medium ${style.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        {style.label}
      </span>
      {detail && <span className="text-xs text-stone-400">{detail}</span>}
    </div>
  );
}

export default function PredocTable({ items }: { items: Predoc[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-center text-stone-400">
        <p className="text-lg">No postings match your filters.</p>
        <p className="text-sm">Try widening your search.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-400">
            <th className="px-5 py-3 font-medium">Position</th>
            <th className="px-5 py-3 font-medium">Location</th>
            <th className="px-5 py-3 font-medium">Starts</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {items.map((predoc) => (
            <tr key={predoc.id} className="group hover:bg-stone-50/80 transition-colors">
              <td className="px-5 py-4 align-top">
                <div className="font-medium text-stone-900">
                  {predoc.institution ?? "Unknown institution"}
                </div>
                {predoc.title && <div className="text-stone-500">{predoc.title}</div>}
              </td>
              <td className="px-5 py-4 align-top text-stone-600">{predoc.location ?? "—"}</td>
              <td className="px-5 py-4 align-top text-stone-600">{predoc.starts ?? "—"}</td>
              <td className="px-5 py-4 align-top">
                <StatusBadge predoc={predoc} />
              </td>
              <td className="px-5 py-4 align-top text-right">
                <a
                  href={predoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-stone-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-teal-700"
                  aria-label={`Open posting for ${predoc.institution ?? "this position"}`}
                >
                  <ExternalLink size={16} strokeWidth={1.75} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
