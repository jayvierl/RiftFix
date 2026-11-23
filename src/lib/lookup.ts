/**
 * Player lookup orchestration.
 *
 * Live path (RIOT_API_KEY set): resolve the Riot ID, pull summoner / league /
 * mastery, fetch the newest match ids, download any matches not already in
 * the Forever archive, archive everything permanently, then build the
 * profile view model from the archive.
 *
 * Archive-only path (no key): if the player was looked up before, serve the
 * saved snapshot + archived matches and say the data is from the archive.
 * If the player was never archived, throw an honest no_key error.
 */
import { getArchive } from "./archive";
import { getChampions } from "./ddragon";
import {
  getAccountByRiotId,
  getLeagueEntriesByPuuid,
  getMatch,
  getMatchIds,
  getSummonerByPuuid,
  getTopMastery,
  hasRiotKey,
  RiotError,
  type RawMatch,
} from "./riot";
import {
  championStats,
  computeNextRankBenchmark,
  computeOneFix,
  playerStatLines,
  poolPattern,
  sessionPatterns,
  statLineFor,
  type ChampionStat,
  type GameStatLine,
  type NextRankBenchmark,
  type OneFixResult,
  type PoolPattern,
  type SessionPatterns,
} from "./analysis";
import type {
  ArchivedMatch,
  ArchivedParticipant,
  PlayerSnapshot,
} from "./types";
import { getPlatform } from "./regions";

export const MATCHES_PER_LOOKUP = 20;

/** A snapshot younger than this is served straight from the archive —
 *  repeat lookups inside the window cost zero Riot API calls. */
const FRESH_SNAPSHOT_MS = 3 * 60 * 1000;

export interface PlayerProfile {
  snapshot: PlayerSnapshot;
  platformLabel: string;
  /** True when served from the archive because no live key is configured. */
  fromArchiveOnly: boolean;
  tracked: boolean;
  matches: ArchivedMatch[];
  championStats: ChampionStat[];
  oneFix: OneFixResult;
  benchmark: NextRankBenchmark;
  pool: PoolPattern;
  sessions: SessionPatterns;
  totals: { games: number; wins: number; winRate: number };
}

function toArchivedParticipant(
  p: RawMatch["info"]["participants"][number]
): ArchivedParticipant {
  const primary = p.perks?.styles?.find((s) => s.description === "primaryStyle");
  const sub = p.perks?.styles?.find((s) => s.description === "subStyle");
  return {
    puuid: p.puuid,
    gameName: p.riotIdGameName ?? p.summonerName ?? "Unknown",
    tagLine: p.riotIdTagline ?? "",
    championId: p.championId,
    championName: p.championName,
    teamId: p.teamId,
    position: (p.individualPosition ?? p.teamPosition ?? "").toUpperCase(),
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    cs: p.totalMinionsKilled + p.neutralMinionsKilled,
    goldEarned: p.goldEarned,
    damageToChampions: p.totalDamageDealtToChampions,
    visionScore: p.visionScore,
    items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5],
    trinket: p.item6,
    keystoneId: primary?.selections?.[0]?.perk ?? 0,
    primaryStyleId: primary?.style ?? 0,
    secondaryStyleId: sub?.style ?? 0,
    win: p.win,
  };
}

function toArchivedMatch(raw: RawMatch, platform: string): ArchivedMatch {
  return {
    matchId: raw.metadata.matchId,
    platform,
    queueId: raw.info.queueId,
    gameStartTimestamp: raw.info.gameStartTimestamp,
    gameDurationSec: raw.info.gameDuration,
    gameVersion: raw.info.gameVersion,
    participants: raw.info.participants.map(toArchivedParticipant),
    archivedAt: new Date().toISOString(),
  };
}

async function buildProfile(
  snapshot: PlayerSnapshot,
  fromArchiveOnly: boolean
): Promise<PlayerProfile> {
  const archive = getArchive();
  const matches = await archive.listMatchesForPlayer(
    snapshot.puuid,
    MATCHES_PER_LOOKUP
  );
  const lines = playerStatLines(matches, snapshot.puuid);
  const wins = lines.filter((l) => l.win).length;

  // Corpus stat lines grouped by the tier of the player who produced them,
  // for the next-rank benchmark. Uses every archived player's snapshots.
  const allMatches = await archive.allMatches();
  const corpusByTier = new Map<string, GameStatLine[]>();
  const puuids = new Set<string>();
  for (const m of allMatches) {
    for (const p of m.participants) puuids.add(p.puuid);
  }
  const tierByPuuid = new Map<string, string>();
  for (const puuid of puuids) {
    const snap = await archive.getPlayerSnapshot(puuid);
    const tier = snap?.solo?.tier ?? snap?.flex?.tier;
    if (tier) tierByPuuid.set(puuid, tier.toUpperCase());
  }
  for (const m of allMatches) {
    for (const p of m.participants) {
      const tier = tierByPuuid.get(p.puuid);
      if (!tier) continue;
      const arr = corpusByTier.get(tier) ?? [];
      arr.push(statLineFor(m, p));
      corpusByTier.set(tier, arr);
    }
  }

  const currentTier = snapshot.solo?.tier ?? snapshot.flex?.tier ?? null;
  return {
    snapshot,
    platformLabel: getPlatform(snapshot.platform)?.label ?? snapshot.platform,
    fromArchiveOnly,
    tracked: await archive.isTracked(snapshot.puuid),
    matches,
    championStats: championStats(lines),
    oneFix: computeOneFix(lines),
    benchmark: computeNextRankBenchmark({
      currentTier,
      playerLines: lines,
      corpusLinesByTier: corpusByTier,
    }),
    pool: poolPattern(lines),
    sessions: sessionPatterns(matches, snapshot.puuid),
    totals: {
      games: lines.length,
      wins,
      winRate: lines.length ? wins / lines.length : 0,
    },
  };
}

export async function lookupPlayer(
  platform: string,
  gameName: string,
  tagLine: string
): Promise<PlayerProfile> {
  const info = getPlatform(platform);
  if (!info) {
    throw new RiotError("unknown_region", 400, `Unknown region "${platform}".`);
  }
  const archive = getArchive();

  if (!hasRiotKey()) {
    const existing = await archive.findPlayerByRiotId(
      info.platform,
      gameName,
      tagLine
    );
    if (existing) return buildProfile(existing, true);
    throw new RiotError(
      "no_key",
      503,
      "Player lookup is not configured: no Riot API key is set on the server (RIOT_API_KEY), and this player is not in the Forever archive yet. Add a key to enable live lookups."
    );
  }

  // Freshness short-circuit: a snapshot refreshed moments ago is built
  // from archived data without touching the Riot API at all.
  const fresh = await archive.findPlayerByRiotId(
    info.platform,
    gameName,
    tagLine
  );
  if (
    fresh &&
    Date.now() - new Date(fresh.updatedAt).getTime() < FRESH_SNAPSHOT_MS
  ) {
    return buildProfile(fresh, false);
  }

  const account = await getAccountByRiotId(info.platform, gameName, tagLine);
  const { champions } = await getChampions();
  const nameById = new Map(champions.map((c) => [c.numericId, c.name]));

  const [summoner, league, mastery] = await Promise.all([
    getSummonerByPuuid(info.platform, account.puuid),
    getLeagueEntriesByPuuid(info.platform, account.puuid),
    getTopMastery(info.platform, account.puuid, nameById, 5),
  ]);

  const snapshot: PlayerSnapshot = {
    puuid: account.puuid,
    platform: info.platform,
    gameName: account.gameName,
    tagLine: account.tagLine,
    summonerLevel: summoner.summonerLevel,
    profileIconId: summoner.profileIconId,
    solo: league.solo,
    flex: league.flex,
    mastery,
    updatedAt: new Date().toISOString(),
  };
  await archive.savePlayerSnapshot(snapshot);

  // Fetch newest matches; archive the ones we don't already keep forever.
  const matchIds = await getMatchIds(
    info.platform,
    account.puuid,
    MATCHES_PER_LOOKUP
  );
  for (const matchId of matchIds) {
    if (await archive.hasMatch(matchId)) continue;
    try {
      const raw = await getMatch(info.platform, matchId);
      await archive.saveMatch(toArchivedMatch(raw, info.platform));
    } catch (e) {
      // A single failed match download shouldn't fail the whole lookup —
      // but a dead key or a hard rate limit fails everything anyway, so
      // surface those instead of silently returning a partial profile.
      if (
        e instanceof RiotError &&
        (e.code === "rate_limited" || e.code === "invalid_key")
      ) {
        throw e;
      }
      console.error(`[lookup] failed to fetch match ${matchId}:`, e);
    }
  }

  return buildProfile(snapshot, false);
}

/** Archive-only profile by puuid (used for tracked accounts / match pages). */
export async function getArchivedProfile(
  puuid: string
): Promise<PlayerProfile | null> {
  const archive = getArchive();
  const snapshot = await archive.getPlayerSnapshot(puuid);
  if (!snapshot) return null;
  return buildProfile(snapshot, !hasRiotKey());
}
