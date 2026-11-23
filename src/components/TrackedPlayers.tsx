"use client";

import Link from "next/link";
import { profilePath } from "@/lib/format";
import { getPlatform } from "@/lib/regions";
import { untrackPlayer, useTrackedPlayers } from "@/lib/tracked-local";

/**
 * Home-page "Your tracked players" section. The list lives only in the
 * visitor's browser (localStorage) — the server never sees it, so this is
 * a client component and renders its empty state during SSR/hydration.
 */
export default function TrackedPlayers() {
  const tracked = useTrackedPlayers();

  return (
    <section className="pb-12">
      <h2 className="text-lg font-bold text-slate-100">Your tracked players</h2>
      {tracked.length === 0 ? (
        <p className="mt-2 rounded-xl bg-slate-900/60 px-4 py-4 text-sm text-slate-400 ring-1 ring-slate-800">
          Players you track are saved in this browser — no account needed.
          Look up a player and tap{" "}
          <span className="text-amber-300">“☆ Track this player”</span> on their
          profile and they will live here, in this browser only.
        </p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {tracked.map((p) => (
            <div
              key={p.puuid}
              className="flex items-center justify-between rounded-xl bg-slate-900/60 px-4 py-3 ring-1 ring-slate-800 transition hover:ring-amber-300/40"
            >
              <Link
                href={profilePath(p.platform, p.gameName, p.tagLine)}
                className="min-w-0"
              >
                <span className="block truncate text-sm font-semibold text-slate-100">
                  {p.gameName}
                  <span className="text-slate-500">#{p.tagLine}</span>
                </span>
                <span className="block text-xs text-slate-500">
                  {getPlatform(p.platform)?.label ?? p.platform}
                </span>
              </Link>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-amber-300">★</span>
                <button
                  onClick={() => untrackPlayer(p.puuid)}
                  className="rounded px-1 text-sm text-slate-500 transition hover:text-slate-200"
                  title="Remove from your tracked players (this browser only)"
                  aria-label={`Untrack ${p.gameName}#${p.tagLine}`}
                >
                  ✕
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
