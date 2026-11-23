"use client";

/**
 * Per-visitor tracked players, stored ONLY in the visitor's own browser
 * (localStorage). Nothing about who a visitor tracks is ever sent to or
 * stored on RiftFix's servers — there is no account system and no
 * server-side tracked list.
 *
 * Storage shape: a JSON array of TrackedPlayer under a versioned key.
 * Components stay in sync through the `storage` event (other tabs) plus a
 * custom same-tab event, wired into React via useSyncExternalStore, which
 * also keeps this SSR-safe: the server snapshot is always an empty list
 * and the real list hydrates in on the client.
 */

import { useSyncExternalStore } from "react";
import type { TrackedPlayer } from "@/lib/types";

export const TRACKED_STORAGE_KEY = "riftfix.tracked.v1";

const CHANGE_EVENT = "riftfix:tracked-changed";
const EMPTY: TrackedPlayer[] = [];

let cachedRaw: string | null = null;
let cachedList: TrackedPlayer[] = EMPTY;

function isTrackedPlayer(value: unknown): value is TrackedPlayer {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.puuid === "string" &&
    typeof v.platform === "string" &&
    typeof v.gameName === "string" &&
    typeof v.tagLine === "string" &&
    typeof v.trackedAt === "string"
  );
}

/** Current tracked list. Returns a stable reference until storage changes. */
export function readTrackedPlayers(): TrackedPlayer[] {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(TRACKED_STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedList;
  cachedRaw = raw;
  if (!raw) {
    cachedList = EMPTY;
    return cachedList;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    cachedList = Array.isArray(parsed) ? parsed.filter(isTrackedPlayer) : EMPTY;
  } catch {
    cachedList = EMPTY;
  }
  return cachedList;
}

function writeTrackedPlayers(list: TrackedPlayer[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRACKED_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage full / blocked (private mode): tracking just won't persist.
  }
  cachedRaw = null; // force re-read on next snapshot
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function trackPlayer(player: Omit<TrackedPlayer, "trackedAt">): void {
  const current = readTrackedPlayers();
  if (current.some((p) => p.puuid === player.puuid)) return;
  writeTrackedPlayers([
    { ...player, trackedAt: new Date().toISOString() },
    ...current,
  ]);
}

export function untrackPlayer(puuid: string): void {
  const current = readTrackedPlayers();
  if (!current.some((p) => p.puuid === puuid)) return;
  writeTrackedPlayers(current.filter((p) => p.puuid !== puuid));
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === TRACKED_STORAGE_KEY) {
      cachedRaw = null;
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function getServerSnapshot(): TrackedPlayer[] {
  return EMPTY;
}

/** React hook: the visitor's tracked players, hydrated from localStorage. */
export function useTrackedPlayers(): TrackedPlayer[] {
  return useSyncExternalStore(subscribe, readTrackedPlayers, getServerSnapshot);
}
