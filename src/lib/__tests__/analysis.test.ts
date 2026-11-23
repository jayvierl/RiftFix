import { describe, expect, it } from "vitest";
import { computeOneFix, type GameStatLine } from "../analysis";

function line(partial: Partial<GameStatLine>): GameStatLine {
  return {
    matchId: "NA1_1",
    win: true,
    championId: 22,
    championName: "Ashe",
    position: "BOTTOM",
    kills: 5,
    deaths: 3,
    assists: 7,
    kda: 4,
    csPerMin: 6,
    damagePerMin: 500,
    goldPerMin: 350,
    visionPerMin: 1,
    killParticipation: 0.6,
    ...partial,
  };
}

const wins = (n: number, partial: Partial<GameStatLine> = {}) =>
  Array.from({ length: n }, () => line({ win: true, ...partial }));
const losses = (n: number, partial: Partial<GameStatLine> = {}) =>
  Array.from({ length: n }, () => line({ win: false, ...partial }));

describe("computeOneFix gating", () => {
  it("is insufficient with fewer than 3 wins", () => {
    const result = computeOneFix([...wins(2), ...losses(5)]);
    expect(result.status).toBe("insufficient");
    expect(result.wins).toBe(2);
    expect(result.losses).toBe(5);
    expect(result.fix).toBeUndefined();
  });

  it("is insufficient with fewer than 3 losses", () => {
    const result = computeOneFix([...wins(6), ...losses(2)]);
    expect(result.status).toBe("insufficient");
    expect(result.message).toContain("3 wins and 3 losses");
  });

  it("is insufficient with no games at all", () => {
    const result = computeOneFix([]);
    expect(result.status).toBe("insufficient");
    expect(result.wins).toBe(0);
    expect(result.losses).toBe(0);
  });

  it("turns ok at exactly 3W / 3L and surfaces the deaths gap", () => {
    const result = computeOneFix([
      ...wins(3, { deaths: 2 }),
      ...losses(3, { deaths: 6 }),
    ]);
    expect(result.status).toBe("ok");
    expect(result.fix?.stat).toBe("deaths");
    expect(result.fix?.winAvg).toBe(2);
    expect(result.fix?.lossAvg).toBe(6);
    // lowerIsBetter: (6 - 2) / 6 = 0.667
    expect(result.fix?.gapPct).toBeCloseTo(2 / 3);
  });

  it("picks the largest gap when several stats differ", () => {
    const result = computeOneFix([
      ...wins(4, { deaths: 3, goldPerMin: 420 }),
      ...losses(4, { deaths: 4, goldPerMin: 300 }),
    ]);
    expect(result.status).toBe("ok");
    // gold gap (420-300)/300 = 0.40 beats deaths gap (4-3)/4 = 0.25
    expect(result.fix?.stat).toBe("goldPerMin");
    expect(result.comparisons?.[0].stat).toBe("goldPerMin");
  });

  it("reports no clear pattern when wins and losses look identical", () => {
    const result = computeOneFix([...wins(3), ...losses(3)]);
    expect(result.status).toBe("insufficient");
    expect(result.message).toContain("No clear win-vs-loss gap");
  });
});
