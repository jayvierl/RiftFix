"use client";

import { useEffect, useState } from "react";
import { Sparkle } from "lucide-react";

interface CorpusState {
  matches: number;
  players: number;
  patch: string | null;
}

/**
 * Live corpus ticker: a slow marquee strip directly under the header on
 * the home page. Seeded with server-rendered values so it paints
 * instantly, then refreshed from /api/status on mount. If the fetch
 * fails, the seeded values simply stay — the strip never breaks the page.
 * Pauses on hover; animation is disabled for reduced-motion visitors
 * (see globals.css).
 */
export default function CorpusTicker({
  initialMatches,
  initialPlayers,
  initialPatch,
  championsCount,
}: {
  initialMatches: number;
  initialPlayers: number;
  initialPatch: string | null;
  championsCount: number | null;
}) {
  const [corpus, setCorpus] = useState<CorpusState>({
    matches: initialMatches,
    players: initialPlayers,
    patch: initialPatch,
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setCorpus({
          matches: data.corpus?.matches ?? initialMatches,
          players: data.corpus?.players ?? initialPlayers,
          patch: data.patch ?? initialPatch,
        });
      })
      .catch(() => {
        // Keep the server-seeded values; the ticker is decorative.
      });
    return () => {
      cancelled = true;
    };
  }, [initialMatches, initialPlayers, initialPatch]);

  const items: string[] = [
    `${corpus.matches.toLocaleString()} matches in the Forever archive`,
    `${corpus.players.toLocaleString()} players archived`,
    ...(championsCount !== null
      ? [`${championsCount} champions tracked`]
      : []),
    ...(corpus.patch ? [`Live patch ${corpus.patch}`] : []),
    "One Fix ready",
    "Honest Builds — sample size always shown",
  ];

  const strip = (ariaHidden: boolean) => (
    <div aria-hidden={ariaHidden} className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span
          key={i}
          className="flex items-center whitespace-nowrap text-xs font-medium tracking-wide text-slate-300"
        >
          <span className="px-4">{item}</span>
          <Sparkle className="h-3 w-3 text-sky-400/70" />
        </span>
      ))}
    </div>
  );

  return (
    <div className="ticker group relative -mx-4 -mt-6 overflow-hidden border-b border-white/5 bg-sky-400/[0.04] py-2">
      <div className="ticker-track flex w-max">
        {strip(false)}
        {strip(true)}
        {strip(true)}
        {strip(true)}
      </div>
    </div>
  );
}
