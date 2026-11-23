/**
 * RiftFix analysis — everything here is computed ONLY from games in the
 * Forever archive. Nothing is scraped, estimated, or invented: when the
 * corpus is too small, the functions return explicit "not enough data"
 * states with sample sizes, and the UI labels them honestly.
 */
import type { ArchivedMatch, ArchivedParticipant } from "./types";

export type Confidence = "Solid" | "Promising" | "Too early";

export function confidenceForSamples(samples: number): Confidence {
  if (samples >= 50) return "Solid";
  if (samples >= 20) return "Promising";
  return "Too early";
}

export const QUEUE_LABELS: Record<number, string> = {
  420: "Ranked Solo",
  440: "Ranked Flex",
  400: "Normal Draft",
  430: "Normal Blind",
  450: "ARAM",
  490: "Quickplay",
  700: "Clash",
  1700: "Arena",
};

export function queueLabel(queueId: number): string {
  return QUEUE_LABELS[queueId] ?? `Queue ${queueId}`;
}

export const RANKED_QUEUES = [420, 440];

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

export function nextTier(tier: string | null | undefined): string | null {
  if (!tier) return null;
  const i = TIER_ORDER.indexOf(tier.toUpperCase());
  if (i < 0 || i >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[i + 1];
}

/* ------------------------------ per-game stats ----------------------------- */

export interface GameStatLine {
  matchId: string;
  win: boolean;
  championId: number;
  championName: string;
  position: string;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  csPerMin: number;
  damagePerMin: number;
  goldPerMin: number;
  visionPerMin: number;
  killParticipation: number; // 0..1
}

export function statLineFor(
  match: ArchivedMatch,
  p: ArchivedParticipant
): GameStatLine {
  const minutes = Math.max(match.gameDurationSec / 60, 1);
  const teamKills = match.participants
    .filter((x) => x.teamId === p.teamId)
    .reduce((s, x) => s + x.kills, 0);
  return {
    matchId: match.matchId,
    win: p.win,
    championId: p.championId,
    championName: p.championName,
    position: p.position,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    kda: (p.kills + p.assists) / Math.max(p.deaths, 1),
    csPerMin: p.cs / minutes,
    damagePerMin: p.damageToChampions / minutes,
    goldPerMin: p.goldEarned / minutes,
    visionPerMin: p.visionScore / minutes,
    killParticipation: teamKills > 0 ? (p.kills + p.assists) / teamKills : 0,
  };
}

export function playerStatLines(
  matches: ArchivedMatch[],
  puuid: string
): GameStatLine[] {
  const lines: GameStatLine[] = [];
  for (const m of matches) {
    const p = m.participants.find((x) => x.puuid === puuid);
    if (p) lines.push(statLineFor(m, p));
  }
  return lines;
}

/* --------------------------------- One Fix -------------------------------- */

export interface OneFixResult {
  status: "ok" | "insufficient";
  message?: string;
  wins: number;
  losses: number;
  /** The single biggest win-vs-loss gap. */
  fix?: {
    stat: string;
    label: string;
    winAvg: number;
    lossAvg: number;
    /** Relative gap, e.g. 0.42 = wins are 42% better on this stat. */
    gapPct: number;
    format: (v: number) => string;
    advice: string;
  };
  /** All compared stats, sorted by gap size. */
  comparisons?: Array<{
    stat: string;
    label: string;
    winAvg: number;
    lossAvg: number;
    gapPct: number;
  }>;
}

const fmt2 = (v: number) => v.toFixed(2);
const fmtPct = (v: number) => `${Math.round(v * 100)}%`;

const STAT_DEFS: Array<{
  stat: keyof GameStatLine;
  label: string;
  lowerIsBetter?: boolean;
  format: (v: number) => string;
  advice: string;
}> = [
  {
    stat: "deaths",
    label: "Deaths per game",
    lowerIsBetter: true,
    format: fmt2,
    advice:
      "In your archived losses you die noticeably more than in your wins. One option is to play a notch safer after your first death — give up a wave rather than risk a second kill. If your champion needs to play aggressive early, the alternative is to ward for the play first so the risk is informed.",
  },
  {
    stat: "visionPerMin",
    label: "Vision score per minute",
    format: fmt2,
    advice:
      "Your wins come with much better vision numbers, which usually means earlier information about ganks and objectives. One option is a Control Ward on every back and sweeping before objectives rather than after. If gold is tight, even timing your free trinket around dragon and Baron setups captures much of the same edge.",
  },
  {
    stat: "csPerMin",
    label: "CS per minute",
    format: fmt2,
    advice:
      "Your wins farm better — in losses, gold is being left in lane. One option is to shove and secure the wave before roaming. If your champion's strength is early roams, the alternative is to roam on cannon waves, when the CS you miss costs the least.",
  },
  {
    stat: "damagePerMin",
    label: "Damage to champions per minute",
    format: (v) => `${Math.round(v)}`,
    advice:
      "Your wins trade far more damage, which suggests losses come when you're forced onto the back foot. One option is to take the early trades your kit is favoured in. If the matchup genuinely doesn't allow it, the alternative is to play for scaling and concede early pressure on purpose rather than by accident.",
  },
  {
    stat: "goldPerMin",
    label: "Gold per minute",
    format: (v) => `${Math.round(v)}`,
    advice:
      "Your wins convert the map into gold more reliably. One option is to catch side waves before grouping for fights that aren't forced. If your team needs you grouped, the alternative is to take jungle camps on the way — the pattern that matters is income between fights, wherever it comes from.",
  },
  {
    stat: "killParticipation",
    label: "Kill participation",
    format: fmtPct,
    advice:
      "Your wins have you present for far more of your team's kills. One option is to path toward likely fights earlier instead of finishing a side play. If you're on a split-push champion, the alternative is to make the split count — draw pressure and take structures while the fight happens elsewhere.",
  },
  {
    stat: "kda",
    label: "KDA",
    format: fmt2,
    advice:
      "Your KDA gap is the widest signal in your losses. One option is to trade kills for objectives instead of chasing the last hit. If a chase is tempting, the alternative is to ask what it buys — a tower or dragon after the pick is worth more than the pick alone.",
  },
];

export function computeOneFix(lines: GameStatLine[]): OneFixResult {
  const wins = lines.filter((l) => l.win);
  const losses = lines.filter((l) => !l.win);
  if (wins.length < 3 || losses.length < 3) {
    return {
      status: "insufficient",
      wins: wins.length,
      losses: losses.length,
      message: `Not enough data yet — One Fix needs at least 3 wins and 3 losses in the archive (currently ${wins.length}W / ${losses.length}L). It grows with every lookup.`,
    };
  }
  const avg = (arr: GameStatLine[], key: keyof GameStatLine) =>
    arr.reduce((s, l) => s + (l[key] as number), 0) / arr.length;

  const comparisons = STAT_DEFS.map((def) => {
    const winAvg = avg(wins, def.stat);
    const lossAvg = avg(losses, def.stat);
    const base = Math.max(Math.abs(lossAvg), 0.01);
    const gapPct = def.lowerIsBetter
      ? (lossAvg - winAvg) / base
      : (winAvg - lossAvg) / base;
    return { stat: def.stat as string, label: def.label, winAvg, lossAvg, gapPct, def };
  })
    .filter((c) => c.gapPct > 0)
    .sort((a, b) => b.gapPct - a.gapPct);

  if (comparisons.length === 0) {
    return {
      status: "insufficient",
      wins: wins.length,
      losses: losses.length,
      message:
        "No clear win-vs-loss gap yet — your losses don't share one obvious stat pattern in the archived games.",
    };
  }
  const top = comparisons[0];
  return {
    status: "ok",
    wins: wins.length,
    losses: losses.length,
    fix: {
      stat: top.stat,
      label: top.label,
      winAvg: top.winAvg,
      lossAvg: top.lossAvg,
      gapPct: top.gapPct,
      format: top.def.format,
      advice: top.def.advice,
    },
    comparisons: comparisons.map((c) => ({
      stat: c.stat,
      label: c.label,
      winAvg: c.winAvg,
      lossAvg: c.lossAvg,
      gapPct: c.gapPct,
    })),
  };
}

/* --------------------------- next-rank benchmark --------------------------- */

export interface BenchmarkRow {
  label: string;
  yours: number;
  benchmark: number;
  format: (v: number) => string;
}

export interface NextRankBenchmark {
  nextTierName: string | null;
  sampleGames: number;
  confidence: Confidence;
  status: "ok" | "insufficient";
  message?: string;
  rows: BenchmarkRow[];
}

/**
 * Benchmark = average stat lines of archived-corpus players whose saved
 * snapshot tier equals the next tier above the player's current tier.
 * Only real archived games are used; if none exist yet, status is
 * "insufficient" and the UI says so.
 */
export function computeNextRankBenchmark(args: {
  currentTier: string | null;
  playerLines: GameStatLine[];
  corpusLinesByTier: Map<string, GameStatLine[]>;
}): NextRankBenchmark {
  const target = nextTier(args.currentTier);
  if (!target) {
    return {
      nextTierName: null,
      sampleGames: 0,
      confidence: "Too early",
      status: "insufficient",
      rows: [],
      message: args.currentTier
        ? "You're at the top of the ladder — there is no next tier to benchmark against."
        : "No ranked tier on record yet, so there is no next-rank benchmark.",
    };
  }
  const corpus = args.corpusLinesByTier.get(target) ?? [];
  const confidence = confidenceForSamples(corpus.length);
  if (corpus.length < 5 || args.playerLines.length < 3) {
    return {
      nextTierName: target,
      sampleGames: corpus.length,
      confidence,
      status: "insufficient",
      rows: [],
      message: `Not enough archived games from players currently ranked ${target} yet (${corpus.length} found, need at least 5, and 3 of your own games). The benchmark fills in as more players currently ranked ${target} are looked up on RiftFix.`,
    };
  }
  const avg = (arr: GameStatLine[], key: keyof GameStatLine) =>
    arr.reduce((s, l) => s + (l[key] as number), 0) / arr.length;
  const rows: BenchmarkRow[] = [
    { label: "KDA", yours: avg(args.playerLines, "kda"), benchmark: avg(corpus, "kda"), format: fmt2 },
    { label: "Deaths / game", yours: avg(args.playerLines, "deaths"), benchmark: avg(corpus, "deaths"), format: fmt2 },
    { label: "CS / min", yours: avg(args.playerLines, "csPerMin"), benchmark: avg(corpus, "csPerMin"), format: fmt2 },
    { label: "Vision / min", yours: avg(args.playerLines, "visionPerMin"), benchmark: avg(corpus, "visionPerMin"), format: fmt2 },
    { label: "Damage / min", yours: avg(args.playerLines, "damagePerMin"), benchmark: avg(corpus, "damagePerMin"), format: (v) => `${Math.round(v)}` },
    { label: "Kill participation", yours: avg(args.playerLines, "killParticipation"), benchmark: avg(corpus, "killParticipation"), format: fmtPct },
  ];
  return {
    nextTierName: target,
    sampleGames: corpus.length,
    confidence,
    status: "ok",
    rows,
  };
}

/* ------------------------- pool & session patterns ------------------------- */

export interface ChampionStat {
  championId: number;
  championName: string;
  games: number;
  wins: number;
  winRate: number;
  kda: number;
}

export function championStats(lines: GameStatLine[]): ChampionStat[] {
  const byChamp = new Map<number, GameStatLine[]>();
  for (const l of lines) {
    const arr = byChamp.get(l.championId) ?? [];
    arr.push(l);
    byChamp.set(l.championId, arr);
  }
  return [...byChamp.entries()]
    .map(([championId, arr]) => ({
      championId,
      championName: arr[0].championName,
      games: arr.length,
      wins: arr.filter((l) => l.win).length,
      winRate: arr.filter((l) => l.win).length / arr.length,
      kda:
        arr.reduce((s, l) => s + l.kda, 0) / Math.max(arr.length, 1),
    }))
    .sort((a, b) => b.games - a.games);
}

export interface PoolPattern {
  distinctChampions: number;
  totalGames: number;
  top3Share: number; // 0..1 of games on the 3 most-played champions
  top3WinRate: number | null;
  restWinRate: number | null;
  note: string;
}

export function poolPattern(lines: GameStatLine[]): PoolPattern {
  const stats = championStats(lines);
  const total = lines.length;
  const top3 = stats.slice(0, 3);
  const top3Games = top3.reduce((s, c) => s + c.games, 0);
  const top3Wins = top3.reduce((s, c) => s + c.wins, 0);
  const restGames = total - top3Games;
  const restWins = lines.filter((l) => l.win).length - top3Wins;
  let note = "Not enough archived games to read your pool yet.";
  if (total >= 10) {
    if (top3Games / total >= 0.9) {
      note =
        "Extremely focused pool — almost every game is on your top 3. Great for mastery, risky when they're banned or countered.";
    } else if (top3Games / total >= 0.65) {
      note =
        "Focused pool with a little flex — a healthy shape for climbing if the win rates hold.";
    } else {
      note =
        "Wide pool — you're spreading games across many champions. Depth on fewer picks usually climbs faster.";
    }
  }
  return {
    distinctChampions: stats.length,
    totalGames: total,
    top3Share: total ? top3Games / total : 0,
    top3WinRate: top3Games ? top3Wins / top3Games : null,
    restWinRate: restGames ? restWins / restGames : null,
    note,
  };
}

export interface SessionPatterns {
  afterWin: { games: number; winRate: number | null };
  afterLoss: { games: number; winRate: number | null };
  byGameNumber: Array<{ n: string; games: number; winRate: number | null }>;
  note: string;
}

const SESSION_GAP_MS = 45 * 60 * 1000;

export function sessionPatterns(matches: ArchivedMatch[], puuid: string): SessionPatterns {
  const mine = matches
    .map((m) => {
      const p = m.participants.find((x) => x.puuid === puuid);
      return p ? { start: m.gameStartTimestamp, win: p.win } : null;
    })
    .filter((x): x is { start: number; win: boolean } => x !== null)
    .sort((a, b) => a.start - b.start);

  const afterWin = { games: 0, wins: 0 };
  const afterLoss = { games: 0, wins: 0 };
  const byNumber = new Map<string, { games: number; wins: number }>();

  let gameNumber = 0;
  for (let i = 0; i < mine.length; i++) {
    const cur = mine[i];
    const prev = mine[i - 1];
    gameNumber =
      prev && cur.start - prev.start <= SESSION_GAP_MS ? gameNumber + 1 : 1;
    const key = gameNumber >= 6 ? "6+" : `${gameNumber}`;
    const bucket = byNumber.get(key) ?? { games: 0, wins: 0 };
    bucket.games += 1;
    if (cur.win) bucket.wins += 1;
    byNumber.set(key, bucket);
    if (prev) {
      const target = prev.win ? afterWin : afterLoss;
      target.games += 1;
      if (cur.win) target.wins += 1;
    }
  }

  const rate = (g: { games: number; wins: number }) =>
    g.games ? g.wins / g.games : null;

  let note = "Play more archived games and your session patterns will appear here.";
  if (afterLoss.games >= 5 && (rate(afterLoss) ?? 1) < 0.4) {
    note =
      "Your own win rate drops sharply in games right after a loss. One option is a short break before queueing again; another is switching mode or role for a game. This is your data about your sessions — how you use it is up to you.";
  } else if (afterWin.games >= 5 && (rate(afterWin) ?? 0) >= 0.6) {
    note = "You ride momentum well — win streaks tend to keep rolling for you.";
  }

  return {
    afterWin: { games: afterWin.games, winRate: rate(afterWin) },
    afterLoss: { games: afterLoss.games, winRate: rate(afterLoss) },
    byGameNumber: [...byNumber.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([n, g]) => ({ n, games: g.games, winRate: rate(g) })),
    note,
  };
}

/* ------------------------------ Honest Builds ------------------------------ */

export interface BuildGroup {
  championId: number;
  championName: string;
  position: string; // role, or "ALL"
  games: number;
  wins: number;
  winRate: number;
  confidence: Confidence;
  topItems: Array<{ itemId: number; count: number; share: number }>;
  topKeystone: { runeId: number; count: number } | null;
}

export function normalizePosition(position: string): string {
  const p = (position || "").toUpperCase();
  return ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"].includes(p)
    ? p
    : "ALL";
}

export function computeBuilds(matches: ArchivedMatch[]): BuildGroup[] {
  const groups = new Map<string, ArchivedParticipant[]>();
  for (const m of matches) {
    if (!RANKED_QUEUES.includes(m.queueId)) continue;
    for (const p of m.participants) {
      const key = `${p.championId}|${normalizePosition(p.position)}`;
      const arr = groups.get(key) ?? [];
      arr.push(p);
      groups.set(key, arr);
    }
  }
  const builds: BuildGroup[] = [];
  for (const [key, parts] of groups.entries()) {
    const [championIdStr, position] = key.split("|");
    const itemCounts = new Map<number, number>();
    const keystoneCounts = new Map<number, number>();
    for (const p of parts) {
      for (const item of new Set(p.items.filter((i) => i > 0))) {
        itemCounts.set(item, (itemCounts.get(item) ?? 0) + 1);
      }
      if (p.keystoneId > 0) {
        keystoneCounts.set(p.keystoneId, (keystoneCounts.get(p.keystoneId) ?? 0) + 1);
      }
    }
    const wins = parts.filter((p) => p.win).length;
    const topKeystone = [...keystoneCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    builds.push({
      championId: Number(championIdStr),
      championName: parts[0].championName,
      position,
      games: parts.length,
      wins,
      winRate: parts.length ? wins / parts.length : 0,
      confidence: confidenceForSamples(parts.length),
      topItems: [...itemCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([itemId, count]) => ({
          itemId,
          count,
          share: parts.length ? count / parts.length : 0,
        })),
      topKeystone: topKeystone
        ? { runeId: topKeystone[0], count: topKeystone[1] }
        : null,
    });
  }
  return builds.sort((a, b) => b.games - a.games);
}

export interface TierRow {
  championId: number;
  championName: string;
  games: number;
  wins: number;
  winRate: number;
  confidence: Confidence;
  tier: "S" | "A" | "B" | "C" | "—";
}

export function computeTierList(matches: ArchivedMatch[]): TierRow[] {
  const byChamp = new Map<number, { name: string; games: number; wins: number }>();
  for (const m of matches) {
    if (!RANKED_QUEUES.includes(m.queueId)) continue;
    for (const p of m.participants) {
      const row = byChamp.get(p.championId) ?? {
        name: p.championName,
        games: 0,
        wins: 0,
      };
      row.games += 1;
      if (p.win) row.wins += 1;
      byChamp.set(p.championId, row);
    }
  }
  return [...byChamp.entries()]
    .map(([championId, r]) => {
      const winRate = r.games ? r.wins / r.games : 0;
      const confidence = confidenceForSamples(r.games);
      let tier: TierRow["tier"] = "—";
      if (r.games >= 10) {
        tier = winRate >= 0.54 ? "S" : winRate >= 0.52 ? "A" : winRate >= 0.49 ? "B" : "C";
      }
      return {
        championId,
        championName: r.name,
        games: r.games,
        wins: r.wins,
        winRate,
        confidence,
        tier,
      };
    })
    .sort((a, b) => b.winRate - a.winRate || b.games - a.games);
}
