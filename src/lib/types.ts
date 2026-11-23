/** Shared types for the RiftFix archive + analysis layer. */

export interface RankEntry {
  queueType: string; // "RANKED_SOLO_5x5" | "RANKED_FLEX_SR"
  tier: string; // e.g. "GOLD"
  division: string; // e.g. "IV"
  lp: number;
  wins: number;
  losses: number;
}

export interface MasteryEntry {
  championId: number;
  championName: string;
  level: number;
  points: number;
}

export interface ArchivedParticipant {
  puuid: string;
  gameName: string;
  tagLine: string;
  championId: number;
  championName: string;
  teamId: number;
  position: string; // individualPosition: TOP/JUNGLE/MIDDLE/BOTTOM/UTILITY or ""
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  goldEarned: number;
  damageToChampions: number;
  visionScore: number;
  /** item0..item5 (item6 is the trinket, kept separately). */
  items: number[];
  trinket: number;
  keystoneId: number;
  primaryStyleId: number;
  secondaryStyleId: number;
  win: boolean;
}

export interface ArchivedMatch {
  matchId: string;
  platform: string;
  queueId: number;
  gameStartTimestamp: number;
  gameDurationSec: number;
  gameVersion: string;
  participants: ArchivedParticipant[];
  /** ISO timestamp of when RiftFix archived this match. */
  archivedAt: string;
}

export interface PlayerSnapshot {
  puuid: string;
  platform: string;
  gameName: string;
  tagLine: string;
  summonerLevel: number;
  profileIconId: number;
  solo: RankEntry | null;
  flex: RankEntry | null;
  mastery: MasteryEntry[];
  /** ISO timestamp of the last successful live refresh. */
  updatedAt: string;
}

export interface TrackedPlayer {
  puuid: string;
  platform: string;
  gameName: string;
  tagLine: string;
  trackedAt: string;
}

export interface ArchiveCounts {
  matches: number;
  players: number;
  tracked: number;
}
