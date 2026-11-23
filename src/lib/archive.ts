/**
 * Forever archive — RiftFix's permanent store of fetched matches and player
 * snapshots.
 *
 * The rest of the app only talks to the `ArchiveStore` interface, so this
 * JSON-file implementation can later be swapped for a hosted database
 * (Postgres, Turso, Vercel KV/Postgres, ...) without touching callers.
 *
 * Current implementation: three JSON documents under `data/archive/`
 * (configurable with RIFTFIX_DATA_DIR):
 *   - matches.json   { [matchId]: ArchivedMatch }
 *   - players.json   { [puuid]: PlayerSnapshot }
 *   - tracked.json   { [puuid]: TrackedPlayer }
 *
 * Writes are serialized through a small promise queue and written atomically
 * (tmp file + rename) so a crash mid-write cannot corrupt the archive.
 *
 * NOTE: on serverless hosts with an ephemeral filesystem (e.g. Vercel
 * functions) this store is best-effort/local only — see README "Deploy
 * notes". The interface is the seam where a hosted DB plugs in.
 */
import { promises as fs } from "fs";
import path from "path";
import type {
  ArchiveCounts,
  ArchivedMatch,
  PlayerSnapshot,
  TrackedPlayer,
} from "./types";

export interface ArchiveStore {
  saveMatch(match: ArchivedMatch): Promise<void>;
  getMatch(matchId: string): Promise<ArchivedMatch | null>;
  hasMatch(matchId: string): Promise<boolean>;
  /** Most recent archived matches that include this player, newest first. */
  listMatchesForPlayer(puuid: string, limit: number): Promise<ArchivedMatch[]>;
  /** Every archived match (the full corpus used for builds / benchmarks). */
  allMatches(): Promise<ArchivedMatch[]>;
  savePlayerSnapshot(snapshot: PlayerSnapshot): Promise<void>;
  getPlayerSnapshot(puuid: string): Promise<PlayerSnapshot | null>;
  findPlayerByRiotId(
    platform: string,
    gameName: string,
    tagLine: string
  ): Promise<PlayerSnapshot | null>;
  listTracked(): Promise<TrackedPlayer[]>;
  setTracked(player: TrackedPlayer, tracked: boolean): Promise<void>;
  isTracked(puuid: string): Promise<boolean>;
  counts(): Promise<ArchiveCounts>;
}

interface StoreData {
  matches: Record<string, ArchivedMatch>;
  players: Record<string, PlayerSnapshot>;
  tracked: Record<string, TrackedPlayer>;
}

function dataDir(): string {
  if (process.env.RIFTFIX_DATA_DIR) return process.env.RIFTFIX_DATA_DIR;
  // Serverless filesystems (Vercel) are read-only outside /tmp. The /tmp
  // store is per-instance and ephemeral — a hosted DB behind ArchiveStore
  // is the production persistence step; locally we keep data/archive/.
  if (process.env.VERCEL) return "/tmp/riftfix-archive";
  return path.join(/* turbopackIgnore: true */ process.cwd(), "data", "archive");
}

class JsonArchiveStore implements ArchiveStore {
  private cache: StoreData | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  private async load(): Promise<StoreData> {
    if (this.cache) return this.cache;
    const dir = dataDir();
    const read = async <T>(file: string, fallback: T): Promise<T> => {
      try {
        const raw = await fs.readFile(path.join(dir, file), "utf8");
        return JSON.parse(raw) as T;
      } catch {
        return fallback;
      }
    };
    this.cache = {
      matches: await read("matches.json", {}),
      players: await read("players.json", {}),
      tracked: await read("tracked.json", {}),
    };
    return this.cache;
  }

  private persist<K extends keyof StoreData>(key: K): Promise<void> {
    const run = async () => {
      const data = await this.load();
      const dir = dataDir();
      await fs.mkdir(dir, { recursive: true });
      const file = path.join(dir, `${key}.json`);
      const tmp = `${file}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(data[key]));
      await fs.rename(tmp, file);
    };
    this.writeQueue = this.writeQueue.then(run, run);
    return this.writeQueue;
  }

  async saveMatch(match: ArchivedMatch): Promise<void> {
    const data = await this.load();
    if (data.matches[match.matchId]) return; // already archived — immutable
    data.matches[match.matchId] = match;
    await this.persist("matches");
  }

  async getMatch(matchId: string): Promise<ArchivedMatch | null> {
    const data = await this.load();
    return data.matches[matchId] ?? null;
  }

  async hasMatch(matchId: string): Promise<boolean> {
    const data = await this.load();
    return Boolean(data.matches[matchId]);
  }

  async listMatchesForPlayer(
    puuid: string,
    limit: number
  ): Promise<ArchivedMatch[]> {
    const data = await this.load();
    return Object.values(data.matches)
      .filter((m) => m.participants.some((p) => p.puuid === puuid))
      .sort((a, b) => b.gameStartTimestamp - a.gameStartTimestamp)
      .slice(0, limit);
  }

  async allMatches(): Promise<ArchivedMatch[]> {
    const data = await this.load();
    return Object.values(data.matches).sort(
      (a, b) => b.gameStartTimestamp - a.gameStartTimestamp
    );
  }

  async savePlayerSnapshot(snapshot: PlayerSnapshot): Promise<void> {
    const data = await this.load();
    data.players[snapshot.puuid] = snapshot;
    await this.persist("players");
  }

  async getPlayerSnapshot(puuid: string): Promise<PlayerSnapshot | null> {
    const data = await this.load();
    return data.players[puuid] ?? null;
  }

  async findPlayerByRiotId(
    platform: string,
    gameName: string,
    tagLine: string
  ): Promise<PlayerSnapshot | null> {
    const data = await this.load();
    const g = gameName.toLowerCase();
    const t = tagLine.toLowerCase();
    return (
      Object.values(data.players).find(
        (p) =>
          p.platform === platform.toLowerCase() &&
          p.gameName.toLowerCase() === g &&
          p.tagLine.toLowerCase() === t
      ) ?? null
    );
  }

  async listTracked(): Promise<TrackedPlayer[]> {
    const data = await this.load();
    return Object.values(data.tracked).sort((a, b) =>
      a.gameName.localeCompare(b.gameName)
    );
  }

  async setTracked(player: TrackedPlayer, tracked: boolean): Promise<void> {
    const data = await this.load();
    if (tracked) data.tracked[player.puuid] = player;
    else delete data.tracked[player.puuid];
    await this.persist("tracked");
  }

  async isTracked(puuid: string): Promise<boolean> {
    const data = await this.load();
    return Boolean(data.tracked[puuid]);
  }

  async counts(): Promise<ArchiveCounts> {
    const data = await this.load();
    return {
      matches: Object.keys(data.matches).length,
      players: Object.keys(data.players).length,
      tracked: Object.keys(data.tracked).length,
    };
  }
}

// Singleton across hot reloads / route invocations in the same process.
const globalForArchive = globalThis as unknown as {
  riftfixArchive?: ArchiveStore;
};

export function getArchive(): ArchiveStore {
  if (!globalForArchive.riftfixArchive) {
    globalForArchive.riftfixArchive = new JsonArchiveStore();
  }
  return globalForArchive.riftfixArchive;
}
