import { describe, expect, it } from "vitest";
import {
  entryScore,
  isDemotion,
  isPromotion,
  ladderScore,
  latestDelta,
} from "../ladder";
import type { SnapshotHistoryEntry } from "../types";

function entry(partial: Partial<SnapshotHistoryEntry>): SnapshotHistoryEntry {
  return {
    puuid: "p1",
    capturedAt: "2026-11-20T12:00:00.000Z",
    platform: "na1",
    queue: "solo",
    tier: "GOLD",
    division: "IV",
    lp: 0,
    wins: 10,
    losses: 10,
    ...partial,
  };
}

describe("ladderScore", () => {
  it("starts Iron IV at 0", () => {
    expect(ladderScore("IRON", "IV", 0)).toBe(0);
  });

  it("values divisions at 100 each within a tier", () => {
    expect(ladderScore("GOLD", "IV", 0)).toBe(1200);
    expect(ladderScore("GOLD", "III", 0)).toBe(1300);
    expect(ladderScore("GOLD", "II", 50)).toBe(1450);
    expect(ladderScore("GOLD", "I", 0)).toBe(1500);
  });

  it("is continuous across division and tier boundaries", () => {
    expect(ladderScore("GOLD", "II", 99)).toBe(1499);
    expect(ladderScore("GOLD", "I", 0)).toBe(1500);
    expect(ladderScore("SILVER", "I", 99)).toBe(1199);
    expect(ladderScore("GOLD", "IV", 0)).toBe(1200);
  });

  it("stacks LP directly for Master+", () => {
    expect(ladderScore("MASTER", "I", 0)).toBe(2800);
    expect(ladderScore("MASTER", "I", 120)).toBe(2920);
    expect(ladderScore("CHALLENGER", "I", 500)).toBe(3300);
  });

  it("scores unknown tiers -1 and is case-insensitive", () => {
    expect(ladderScore("WOOD", "IV", 0)).toBe(-1);
    expect(ladderScore("gold", "ii", 50)).toBe(1450);
  });
});

describe("promotion / demotion detection", () => {
  it("detects a division promotion", () => {
    expect(
      isPromotion(entry({ division: "III" }), entry({ division: "II", lp: 3 }))
    ).toBe(true);
  });

  it("detects a tier promotion", () => {
    expect(
      isPromotion(
        entry({ tier: "SILVER", division: "I", lp: 90 }),
        entry({ tier: "GOLD", division: "IV", lp: 5 })
      )
    ).toBe(true);
  });

  it("does not call an LP gain inside one division a promotion", () => {
    expect(
      isPromotion(entry({ division: "II", lp: 10 }), entry({ division: "II", lp: 85 }))
    ).toBe(false);
  });

  it("detects demotions symmetrically", () => {
    expect(
      isDemotion(entry({ division: "II" }), entry({ division: "III", lp: 40 }))
    ).toBe(true);
    expect(
      isPromotion(entry({ division: "II" }), entry({ division: "III", lp: 40 }))
    ).toBe(false);
  });
});

describe("latestDelta", () => {
  it("is null with fewer than two snapshots", () => {
    expect(latestDelta([])).toBeNull();
    expect(latestDelta([entry({})])).toBeNull();
  });

  it("computes an exact LP delta inside one division", () => {
    const delta = latestDelta([
      entry({ division: "II", lp: 20 }),
      entry({ division: "II", lp: 44, capturedAt: "2026-11-21T12:00:00.000Z" }),
    ]);
    expect(delta?.scoreDelta).toBe(24);
    expect(delta?.sameDivision).toBe(true);
    expect(delta?.promoted).toBe(false);
  });

  it("flags promotions and crosses divisions in the score", () => {
    const delta = latestDelta([
      entry({ division: "II", lp: 88 }),
      entry({ division: "I", lp: 12, capturedAt: "2026-11-21T12:00:00.000Z" }),
    ]);
    expect(delta?.promoted).toBe(true);
    expect(delta?.sameDivision).toBe(false);
    expect(delta?.scoreDelta).toBe(24); // 1512 - 1488
    expect(delta && entryScore(delta.curr)).toBe(1512);
  });
});
