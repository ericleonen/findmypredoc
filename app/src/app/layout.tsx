import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import Link from "next/link";
import { GitBranch, BookOpen, Info } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["italic", "normal"],
});

export const metadata: Metadata = {
  title: "Find My Predoc",
  description:
    "Find pre-doctoral research assistant positions from NBER, Econ Job Market, and PREDOC.org, filterable by application status and start date.",
};

const navLinks = [
  { href: "https://github.com/ericleonen/findmypredoc", label: "Source", icon: GitBranch, external: true },
  { href: "/api/docs", label: "API docs", icon: BookOpen, external: true },
  { href: "/about", label: "About", icon: Info, external: false },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-ink font-sans">
        <header className="sticky top-0 z-50 border-b-[3px] border-ink bg-mint-200/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3">
            <Link href="/" className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-ink">
                Find My <span className="italic">Predoc</span>
              </h1>
              <span className="hidden sm:inline text-xs font-medium uppercase tracking-wide text-ink/60">
                predoc listings, updated daily
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-2">
              {navLinks.map(({ href, label, icon: Icon, external }) =>
                external ? (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-md border-2 border-ink bg-paper px-2.5 py-1 text-sm font-semibold shadow-brutal-sm press-brutal hover:bg-mint-100"
                  >
                    <Icon size={14} strokeWidth={2} />
                    {label}
                  </a>
                ) : (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-1.5 rounded-md border-2 border-ink bg-paper px-2.5 py-1 text-sm font-semibold shadow-brutal-sm press-brutal hover:bg-mint-100"
                  >
                    <Icon size={14} strokeWidth={2} />
                    {label}
                  </Link>
                )
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1 w-full">{children}</main>
      </body>
    </html>
  );
}
