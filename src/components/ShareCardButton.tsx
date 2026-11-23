"use client";

import { Share2 } from "lucide-react";

/**
 * Opens the player's shareable season card (a 1200×630 PNG rendered by
 * /api/card from archived data only). Opens in a new tab with a download
 * filename hint so it can be saved and posted to X / Discord as-is.
 */
export default function ShareCardButton({
  platform,
  gameName,
  tagLine,
}: {
  platform: string;
  gameName: string;
  tagLine: string;
}) {
  const q = new URLSearchParams({ platform, gameName, tagLine });
  return (
    <a
      href={`/api/card?${q.toString()}`}
      target="_blank"
      rel="noreferrer"
      download="riftfix-season-card.png"
      className="flex items-center gap-2 rounded-xl bg-slate-800/80 px-3.5 py-2 text-sm font-semibold text-slate-200 ring-1 ring-slate-700 transition hover:bg-slate-700/80 hover:text-white"
    >
      <Share2 className="h-4 w-4 text-sky-300" />
      Share your season card
    </a>
  );
}
