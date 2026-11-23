"use client";

import { Star } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
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
      toast("Removed from your tracked players", {
        description: "Tracking lives in this browser only.",
      });
    } else {
      const isFirstEver = trackedPlayers.length === 0;
      trackPlayer({ puuid, platform, gameName, tagLine });
      toast.success("Saved in your browser", {
        description: `${gameName}#${tagLine} is now on your home page — in this browser only.`,
      });
      if (isFirstEver) {
        // A tiny celebration for the first tracked player (audit's
        // "first-time track" moment), in brand colours.
        confetti({
          particleCount: 70,
          spread: 65,
          startVelocity: 32,
          origin: { y: 0.25 },
          colors: ["#22d3ee", "#8b5cf6", "#ffffff"],
          disableForReducedMotion: true,
        });
      }
    }
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition ${
        tracked
          ? "bg-amber-400/15 text-amber-300 ring-amber-300/40 hover:bg-amber-400/25"
          : "bg-slate-800 text-slate-300 ring-slate-600 hover:bg-slate-700"
      }`}
      title="Tracking is per-visitor: this player is saved only in your own browser (local storage), never on RiftFix's servers."
    >
      <Star
        className="h-3.5 w-3.5"
        fill={tracked ? "currentColor" : "none"}
      />
      {tracked
        ? "Tracked — saved in your browser"
        : "Track this player (saved in your browser)"}
    </button>
  );
}
