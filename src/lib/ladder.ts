/**
 * Ladder math for snapshot history: converts a (tier, division, LP) rank
 * into a single comparable score so LP deltas and climb charts work across
 * division and tier boundaries.
 *
 * Score layout: each tier owns a 400-point band — 100 per division
 * (IV=0, III=100, II=200, I=300) plus 0–99 LP. Master and above have no
 * divisions: score = 2800 + LP, so a Master player's LP stacks directly
 * on top of the Diamond band.
 */
import type { SnapshotHistoryEntry } from "./types";

export const TIER_BASE: Record<string, number> = {
  IRON: 0,
  BRONZE: 400,
  SILVER: 800,
  GOLD: 1200,
  PLATINUM: 1600,
  EMERALD: 2000,
  DIAMOND: 2400,
  MASTER: 2800,
  GRANDMASTER: 2800,
  CHALLENGER: 2800,
};

export const APEX_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

const DIVISION_VALUE: Record<string, number> = {
  IV: 0,
  III: 100,
  II: 200,
  I: 300,
};

const TIER_ORDER = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
];

/** Single-number ladder position for a rank. Unknown tiers score -1. */
export function ladderScore(tier: string, division: string, lp: number): number {
  const t = tier.toUpperCase();
  const base = TIER_BASE[t];
  if (base === undefined) return -1;
  if (APEX_TIERS.has(t)) return base + Math.max(lp, 0);
  const div = DIVISION_VALUE[division.toUpperCase()] ?? 0;
  return base + div + Math.max(lp, 0);
}

export function entryScore(entry: SnapshotHistoryEntry): number {
  return ladderScore(entry.tier, entry.division, entry.lp);
}

/**
 * Standing comparison ignoring LP: (tier order, division value). A rise in
 * this tuple is a promotion (or the reverse a demotion) — LP gains inside
 * the same division are not promotions.
 */
function standing(entry: SnapshotHistoryEntry): [number, number] {
  const t = entry.tier.toUpperCase();
  const tierIdx = TIER_ORDER.indexOf(t);
  if (APEX_TIERS.has(t)) return [tierIdx, 0];
  return [tierIdx, DIVISION_VALUE[entry.division.toUpperCase()] ?? 0];
}

export function isPromotion(
  prev: SnapshotHistoryEntry,
  curr: SnapshotHistoryEntry
): boolean {
  const [pt, pd] = standing(prev);
  const [ct, cd] = standing(curr);
  return ct > pt || (ct === pt && cd > pd);
}

export function isDemotion(
  prev: SnapshotHistoryEntry,
  curr: SnapshotHistoryEntry
): boolean {
  const [pt, pd] = standing(prev);
  const [ct, cd] = standing(curr);
  return ct < pt || (ct === pt && cd < pd);
}

export interface HistoryDelta {
  /** The earlier of the two compared snapshots. */
  prev: SnapshotHistoryEntry;
  /** The latest snapshot. */
  curr: SnapshotHistoryEntry;
  /** Ladder-score change (ladderScore(curr) - ladderScore(prev)). */
  scoreDelta: number;
  /** True when tier/division standing rose (LP-only gains don't count). */
  promoted: boolean;
  demoted: boolean;
  /** True when both snapshots sit in the same tier+division, so
   *  scoreDelta is exactly an LP delta. */
  sameDivision: boolean;
}

/**
 * Delta between the latest snapshot and the one before it, or null when
 * fewer than two snapshots exist. `history` must be oldest-first.
 */
export function latestDelta(
  history: SnapshotHistoryEntry[]
): HistoryDelta | null {
  if (history.length < 2) return null;
  const prev = history[history.length - 2];
  const curr = history[history.length - 1];
  return {
    prev,
    curr,
    scoreDelta: entryScore(curr) - entryScore(prev),
    promoted: isPromotion(prev, curr),
    demoted: isDemotion(prev, curr),
    sameDivision:
      prev.tier.toUpperCase() === curr.tier.toUpperCase() &&
      (APEX_TIERS.has(curr.tier.toUpperCase()) ||
        prev.division.toUpperCase() === curr.division.toUpperCase()),
  };
}
