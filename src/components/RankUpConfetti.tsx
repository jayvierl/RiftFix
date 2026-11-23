"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

/**
 * One celebratory burst when a profile view shows a tier/division
 * promotion versus the previous snapshot. Fires at most once per
 * (player, latest snapshot) per browser session — sessionStorage guards
 * re-renders and repeat visits within the session — and never for
 * reduced-motion visitors. LP gains without a promotion don't fire.
 */
export default function RankUpConfetti({
  fire,
  fireKey,
}: {
  fire: boolean;
  /** Unique per player+snapshot, e.g. `${puuid}:${capturedAt}`. */
  fireKey: string;
}) {
  useEffect(() => {
    if (!fire) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const key = `riftfix.rankup.${fireKey}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage unavailable (private mode): fall through and fire once
      // for this mount; the effect deps keep it from repeating.
    }
    const base = {
      origin: { y: 0.22 },
      zIndex: 60,
      disableForReducedMotion: true,
    } as const;
    confetti({
      ...base,
      particleCount: 90,
      spread: 75,
      startVelocity: 38,
      colors: ["#22d3ee", "#38bdf8", "#e6edf7"],
    });
    confetti({
      ...base,
      particleCount: 70,
      spread: 105,
      startVelocity: 30,
      scalar: 0.9,
      colors: ["#8b5cf6", "#a78bfa", "#22d3ee"],
    });
  }, [fire, fireKey]);

  return null;
}
