import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import Link from "next/link";
import Footer from "@/components/Footer";
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
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 font-sans">
        <header className="flex flex-col items-center gap-1 pt-14 pb-8 px-6 text-center">
          <Link href="/">
            <h1 className="font-serif text-4xl sm:text-5xl tracking-tight text-stone-900">
              Find My <span className="italic text-teal-700">Predoc</span>
            </h1>
          </Link>
          <p className="text-stone-500 text-sm sm:text-base">
            Pre-doctoral research positions, updated daily.
          </p>
        </header>
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
