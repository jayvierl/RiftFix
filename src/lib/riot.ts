/**
 * Riot Games API client — SERVER SIDE ONLY.
 *
 * The API key is read from the RIOT_API_KEY environment variable at runtime
 * and sent as the X-Riot-Token header. It is never exposed to the client,
 * never logged, and never committed to the repo (see .env.example).
 *
 * This module must only be imported from server components, route handlers,
 * or other server-only code.
 */
import { getPlatform, platformHost, regionalHost } from "./regions";
import type { MasteryEntry, RankEntry } from "./types";

export class RiotError extends Error {
  status: number;
  code:
    | "no_key"
    | "not_found"
    | "invalid_key"
    | "rate_limited"
    | "upstream"
    | "unknown_region";
  constructor(
    code: RiotError["code"],
    status: number,
    message: string
  ) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function hasRiotKey(): boolean {
  return Boolean(process.env.RIOT_API_KEY && process.env.RIOT_API_KEY.trim());
}

function requireKey(): string {
  const key = process.env.RIOT_API_KEY?.trim();
  if (!key) {
    throw new RiotError(
      "no_key",
      503,
      "Player lookup is not configured: no Riot API key is set on the server (RIOT_API_KEY). Add one in the environment to enable live lookups."
    );
  }
  return key;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function riotFetch<T>(url: string, attempt = 0): Promise<T> {
  const key = requireKey();
  const res = await fetch(url, {
    headers: { "X-Riot-Token": key },
    cache: "no-store",
  });
  if (res.status === 404) {
    throw new RiotError("not_found", 404, "Not found on the Riot API.");
  }
  if (res.status === 401 || res.status === 403) {
    throw new RiotError(
      "invalid_key",
      res.status,
      "Riot rejected the server API key (it may be expired — development keys expire every 24 hours). Generate a fresh key at developer.riotgames.com and update RIOT_API_KEY."
    );
  }
  if (res.status === 429) {
    if (attempt >= 2) {
      throw new RiotError(
        "rate_limited",
        429,
        "Riot API rate limit reached. Please try again in a moment."
      );
    }
    const retryAfter = Number(res.headers.get("Retry-After") ?? "1");
    await sleep(Math.min(retryAfter, 5) * 1000);
    return riotFetch<T>(url, attempt + 1);
  }
  if (!res.ok) {
    throw new RiotError(
      "upstream",
      res.status,
      `Riot API request failed (${res.status}).`
    );
  }
  return (await res.json()) as T;
}

function requirePlatform(platform: string) {
  const info = getPlatform(platform);
  if (!info) {
    throw new RiotError(
      "unknown_region",
      400,
      `Unknown region "${platform}". Pick one of the supported regions.`
    );
  }
  return info;
}

/* ---------------------------------- types --------------------------------- */

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotSummoner {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

interface RawLeagueEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

interface RawMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
}

export interface RawMatchParticipant {
  puuid: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  summonerName?: string;
  championId: number;
  championName: string;
  teamId: number;
  individualPosition?: string;
  teamPosition?: string;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;
  totalDamageDealtToChampions: number;
  visionScore: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  win: boolean;
  perks?: {
    styles?: Array<{
      description: string;
      style: number;
      selections?: Array<{ perk: number }>;
    }>;
  };
}

export interface RawMatch {
  metadata: { matchId: string; participants: string[] };
  info: {
    gameStartTimestamp: number;
    gameDuration: number;
    gameVersion: string;
    queueId: number;
    platformId: string;
    participants: RawMatchParticipant[];
  };
}

/* --------------------------------- methods -------------------------------- */

export async function getAccountByRiotId(
  platform: string,
  gameName: string,
  tagLine: string
): Promise<RiotAccount> {
  const info = requirePlatform(platform);
  const url =
    `${regionalHost(info.region)}/riot/account/v1/accounts/by-riot-id/` +
    `${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  try {
    return await riotFetch<RiotAccount>(url);
  } catch (e) {
    if (e instanceof RiotError && e.code === "not_found") {
      throw new RiotError(
        "not_found",
        404,
        `No player found for ${gameName}#${tagLine} in ${info.label}. Check the spelling, tag, and region.`
      );
    }
    throw e;
  }
}

export async function getSummonerByPuuid(
  platform: string,
  puuid: string
): Promise<RiotSummoner> {
  requirePlatform(platform);
  return riotFetch<RiotSummoner>(
    `${platformHost(platform)}/lol/summoner/v4/summoners/by-puuid/${puuid}`
  );
}

export async function getLeagueEntriesByPuuid(
  platform: string,
  puuid: string
): Promise<{ solo: RankEntry | null; flex: RankEntry | null }> {
  requirePlatform(platform);
  const entries = await riotFetch<RawLeagueEntry[]>(
    `${platformHost(platform)}/lol/league/v4/entries/by-puuid/${puuid}`
  );
  const map = (e?: RawLeagueEntry): RankEntry | null =>
    e
      ? {
          queueType: e.queueType,
          tier: e.tier,
          division: e.rank,
          lp: e.leaguePoints,
          wins: e.wins,
          losses: e.losses,
        }
      : null;
  return {
    solo: map(entries.find((e) => e.queueType === "RANKED_SOLO_5x5")),
    flex: map(entries.find((e) => e.queueType === "RANKED_FLEX_SR")),
  };
}

export async function getTopMastery(
  platform: string,
  puuid: string,
  championNameById: Map<number, string>,
  count = 5
): Promise<MasteryEntry[]> {
  requirePlatform(platform);
  const raw = await riotFetch<RawMastery[]>(
    `${platformHost(platform)}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`
  );
  return raw.map((m) => ({
    championId: m.championId,
    championName: championNameById.get(m.championId) ?? `Champion ${m.championId}`,
    level: m.championLevel,
    points: m.championPoints,
  }));
}

export async function getMatchIds(
  platform: string,
  puuid: string,
  count = 20
): Promise<string[]> {
  const info = requirePlatform(platform);
  return riotFetch<string[]>(
    `${regionalHost(info.region)}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`
  );
}

export async function getMatch(
  platform: string,
  matchId: string
): Promise<RawMatch> {
  const info = requirePlatform(platform);
  return riotFetch<RawMatch>(
    `${regionalHost(info.region)}/lol/match/v5/matches/${matchId}`
  );
}

export async function getMatchTimeline(
  platform: string,
  matchId: string
): Promise<unknown> {
  const info = requirePlatform(platform);
  return riotFetch<unknown>(
    `${regionalHost(info.region)}/lol/match/v5/matches/${matchId}/timeline`
  );
}
