import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About - Find My Predoc",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-md border-2 border-ink bg-paper p-6 shadow-brutal">
        <h2 className="font-serif text-2xl font-bold text-ink mb-4">About</h2>
        <div className="flex flex-col gap-4 leading-relaxed text-ink/80">
          <p>
            Find My Predoc collects pre-doctoral research assistant listings from{" "}
            <a
              href="https://www.nber.org/career-resources"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ink underline decoration-mint-500 decoration-2 underline-offset-2 hover:bg-mint-100"
            >
              NBER
            </a>
            ,{" "}
            <a
              href="https://econjobmarket.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ink underline decoration-mint-500 decoration-2 underline-offset-2 hover:bg-mint-100"
            >
              Econ Job Market
            </a>
            , and{" "}
            <a
              href="https://www.predoc.org/opportunities"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ink underline decoration-mint-500 decoration-2 underline-offset-2 hover:bg-mint-100"
            >
              PREDOC.org
            </a>
            , reads each posting, and uses an LLM to extract the fields that matter most when
            you&rsquo;re deciding whether a position fits your timeline: when applications open
            and close, and when the position starts.
          </p>
          <p>
            Postings are refreshed daily. Application status (open, upcoming, or closed) is
            computed from today&rsquo;s date against each posting&rsquo;s application window.
          </p>
          <p>
            Built by{" "}
            <a
              href="https://github.com/ericleonen"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ink underline decoration-mint-500 decoration-2 underline-offset-2 hover:bg-mint-100"
            >
              ericleonen
            </a>
            . The full source is on{" "}
            <a
              href="https://github.com/ericleonen/findmypredoc"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ink underline decoration-mint-500 decoration-2 underline-offset-2 hover:bg-mint-100"
            >
              GitHub
            </a>
            , including the scraping/extraction pipeline and the{" "}
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ink underline decoration-mint-500 decoration-2 underline-offset-2 hover:bg-mint-100"
            >
              API
            </a>{" "}
            this site is built on.
          </p>
          <Link
            href="/"
            className="mt-2 inline-flex w-fit items-center rounded-md border-2 border-ink bg-mint-200 px-3 py-1.5 text-sm font-bold shadow-brutal-sm press-brutal hover:bg-mint-100"
          >
            ← Back to listings
          </Link>
        </div>
      </div>
    </div>
  );
}
