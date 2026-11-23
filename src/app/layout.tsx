import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
  ),
  title: "RiftFix — League of Legends stats, One Fix, Honest Builds",
  description:
    "Look up any League of Legends player: ranks, match history, champion mastery, a permanent Forever archive, your One Fix, and builds computed honestly from real archived games.",
  openGraph: {
    title: "RiftFix — League of Legends stats, One Fix, Honest Builds",
    description:
      "Player lookups, a permanent Forever archive, your One Fix, and Honest Builds computed only from real archived games.",
    siteName: "RiftFix",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-white/5 bg-[#070b14]/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-xl font-black tracking-tight text-slate-50">
                Rift<span className="text-sky-400">Fix</span>
              </span>
              <span className="hidden text-[11px] font-medium uppercase tracking-widest text-amber-300/80 sm:inline">
                One Fix · Honest Builds · Forever
              </span>
            </Link>
            <nav className="ml-auto flex items-center gap-1 text-sm font-medium text-slate-300">
              <Link href="/" className="rounded-lg px-3 py-1.5 hover:bg-slate-800 hover:text-white">
                Home
              </Link>
              <Link href="/champions" className="rounded-lg px-3 py-1.5 hover:bg-slate-800 hover:text-white">
                Champions
              </Link>
              <Link href="/builds" className="rounded-lg px-3 py-1.5 hover:bg-slate-800 hover:text-white">
                Builds &amp; Tier List
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>

        <footer className="border-t border-white/5 py-6">
          <div className="mx-auto w-full max-w-6xl px-4 text-xs leading-relaxed text-slate-500">
            <p>
              RiftFix is a fan-made stats tool. Every build, benchmark, and tier
              on this site is computed only from matches stored in RiftFix&apos;s
              own Forever archive — sample sizes and confidence are always shown,
              and nothing is presented as fact before the data backs it up.
            </p>
            <p className="mt-3 flex gap-4">
              <Link href="/terms" className="text-slate-400 underline decoration-slate-600 underline-offset-2 hover:text-sky-300">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-slate-400 underline decoration-slate-600 underline-offset-2 hover:text-sky-300">
                Privacy Policy
              </Link>
            </p>
            <p className="mt-2">
              RiftFix isn&apos;t endorsed by Riot Games and doesn&apos;t reflect
              the views or opinions of Riot Games or anyone officially involved
              in producing or managing League of Legends. League of Legends and
              Riot Games are trademarks or registered trademarks of Riot Games,
              Inc.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
