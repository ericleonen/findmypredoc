import Link from "next/link";
import { GitBranch, BookOpen, Info } from "lucide-react";

const links = [
  {
    href: "https://github.com/ericleonen",
    label: "ericleonen",
    icon: GitBranch,
    external: true,
  },
  {
    href: "https://github.com/ericleonen/findmypredoc",
    label: "Source",
    icon: GitBranch,
    external: true,
  },
  {
    href: "/api/docs",
    label: "API docs",
    icon: BookOpen,
    external: true,
  },
  {
    href: "/about",
    label: "About",
    icon: Info,
    external: false,
  },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-stone-200 px-6 py-8">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 text-sm text-stone-500">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {links.map(({ href, label, icon: Icon, external }) =>
            external ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-teal-700 transition-colors"
              >
                <Icon size={15} strokeWidth={1.75} />
                {label}
              </a>
            ) : (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-1.5 hover:text-teal-700 transition-colors"
              >
                <Icon size={15} strokeWidth={1.75} />
                {label}
              </Link>
            )
          )}
        </nav>
        <p className="text-xs text-stone-400">
          Built by ericleonen. Data from NBER, Econ Job Market, and PREDOC.org.
        </p>
      </div>
    </footer>
  );
}
