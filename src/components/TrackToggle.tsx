"use client";

import {
  trackPlayer,
  untrackPlayer,
  useTrackedPlayers,
} from "@/lib/tracked-local";

export default function TrackToggle({
  puuid,
  platform,
  gameName,
  tagLine,
}: {
  puuid: string;
  platform: string;
  gameName: string;
  tagLine: string;
}) {
  const trackedPlayers = useTrackedPlayers();
  const tracked = trackedPlayers.some((p) => p.puuid === puuid);

  function toggle() {
    if (tracked) {
      untrackPlayer(puuid);
    } else {
      trackPlayer({ puuid, platform, gameName, tagLine });
    }
  }

  return (
    <button
      onClick={toggle}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition ${
        tracked
          ? "bg-amber-400/15 text-amber-300 ring-amber-300/40 hover:bg-amber-400/25"
          : "bg-slate-800 text-slate-300 ring-slate-600 hover:bg-slate-700"
      }`}
      title="Tracking is per-visitor: this player is saved only in your own browser (local storage), never on RiftFix's servers."
    >
      {tracked
        ? "★ Tracked — saved in your browser"
        : "☆ Track this player (saved in your browser)"}
    </button>
  );
}
