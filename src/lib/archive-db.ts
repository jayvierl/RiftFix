/**
 * Forever archive — Postgres implementation (Neon, via the serverless HTTP
 * driver), used whenever DATABASE_URL is set. This is the production store:
 * unlike the JSON file store it persists across serverless instances, so
 * the archive, builds corpus, and benchmarks actually accumulate.
 *
 * Schema (created lazily on first use):
 *   matches(match_id text PK, game_start_ts bigint, data jsonb)
 *   match_participants(match_id text, puuid text, PK(match_id, puuid),
 *                      index on puuid)
 *   players(puuid text PK, platform text, game_name_lower text,
 *           tag_lower text, data jsonb, index on the lower triple)
 *   tracked(puuid text PK, data jsonb)
 *
 * Full payloads live in `data` jsonb so the payload types stay identical to
 * the JSON store; the scalar columns exist only for lookups and ordering.
 * Matches are immutable: saveMatch is INSERT ... ON CONFLICT DO NOTHING,
 * which is also race-safe when two instances archive the same match.
 */
import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { ArchiveStore } from "./archive";
import type {
  ArchiveCounts,
  ArchivedMatch,
  PlayerSnapshot,
  TrackedPlayer,
} from "./types";

type Sql = NeonQueryFunction<false, false>;

export class PostgresArchiveStore implements ArchiveStore {
  private sqlClient: Sql | null = null;
  private schemaReady: Promise<void> | null = null;

  private sql(): Sql {
    if (!this.sqlClient) {
      const url = process.env.DATABASE_URL;
      if (!url) {
        throw new Error(
          "PostgresArchiveStore requires DATABASE_URL to be set."
        );
      }
      this.sqlClient = neon(url);
    }
    return this.sqlClient;
  }

  /** CREATE TABLE IF NOT EXISTS on first use; the promise is shared so
   *  concurrent first requests don't race the DDL. */
  private ready(): Promise<void> {
    if (!this.schemaReady) {
      const sql = this.sql();
      this.schemaReady = (async () => {
        await sql`CREATE TABLE IF NOT EXISTS matches (
          match_id text PRIMARY KEY,
          game_start_ts bigint NOT NULL,
          data jsonb NOT NULL
        )`;
        await sql`CREATE TABLE IF NOT EXISTS match_participants (
          match_id text NOT NULL,
          puuid text NOT NULL,
          PRIMARY KEY (match_id, puuid)
        )`;
        await sql`CREATE INDEX IF NOT EXISTS match_participants_puuid_idx
          ON match_participants (puuid)`;
        await sql`CREATE TABLE IF NOT EXISTS players (
          puuid text PRIMARY KEY,
          platform text NOT NULL,
          game_name_lower text NOT NULL,
          tag_lower text NOT NULL,
          data jsonb NOT NULL
        )`;
        await sql`CREATE INDEX IF NOT EXISTS players_riot_id_idx
          ON players (platform, game_name_lower, tag_lower)`;
        await sql`CREATE TABLE IF NOT EXISTS tracked (
          puuid text PRIMARY KEY,
          data jsonb NOT NULL
        )`;
      })();
    }
    return this.schemaReady;
  }

  async saveMatch(match: ArchivedMatch): Promise<void> {
    await this.ready();
    const sql = this.sql();
    const inserted = await sql`
      INSERT INTO matches (match_id, game_start_ts, data)
      VALUES (${match.matchId}, ${match.gameStartTimestamp}, ${JSON.stringify(match)}::jsonb)
      ON CONFLICT (match_id) DO NOTHING
      RETURNING match_id
    `;
    if (inserted.length === 0) return; // already archived — immutable
    // Index the participants for per-player match listing. DO NOTHING keeps
    // this idempotent if it ever runs twice for the same match.
    for (const p of match.participants) {
      await sql`
        INSERT INTO match_participants (match_id, puuid)
        VALUES (${match.matchId}, ${p.puuid})
        ON CONFLICT (match_id, puuid) DO NOTHING
      `;
    }
  }

  async getMatch(matchId: string): Promise<ArchivedMatch | null> {
    await this.ready();
    const rows = await this.sql()`
      SELECT data FROM matches WHERE match_id = ${matchId}
    `;
    return rows.length ? (rows[0].data as ArchivedMatch) : null;
  }

  async hasMatch(matchId: string): Promise<boolean> {
    await this.ready();
    const rows = await this.sql()`
      SELECT 1 AS one FROM matches WHERE match_id = ${matchId}
    `;
    return rows.length > 0;
  }

  async listMatchesForPlayer(
    puuid: string,
    limit: number
  ): Promise<ArchivedMatch[]> {
    await this.ready();
    const rows = await this.sql()`
      SELECT m.data AS data
      FROM matches m
      JOIN match_participants mp ON mp.match_id = m.match_id
      WHERE mp.puuid = ${puuid}
      ORDER BY m.game_start_ts DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => r.data as ArchivedMatch);
  }

  async allMatches(): Promise<ArchivedMatch[]> {
    await this.ready();
    const rows = await this.sql()`
      SELECT data FROM matches ORDER BY game_start_ts DESC
    `;
    return rows.map((r) => r.data as ArchivedMatch);
  }

  async savePlayerSnapshot(snapshot: PlayerSnapshot): Promise<void> {
    await this.ready();
    await this.sql()`
      INSERT INTO players (puuid, platform, game_name_lower, tag_lower, data)
      VALUES (
        ${snapshot.puuid},
        ${snapshot.platform},
        ${snapshot.gameName.toLowerCase()},
        ${snapshot.tagLine.toLowerCase()},
        ${JSON.stringify(snapshot)}::jsonb
      )
      ON CONFLICT (puuid) DO UPDATE SET
        platform = EXCLUDED.platform,
        game_name_lower = EXCLUDED.game_name_lower,
        tag_lower = EXCLUDED.tag_lower,
        data = EXCLUDED.data
    `;
  }

  async getPlayerSnapshot(puuid: string): Promise<PlayerSnapshot | null> {
    await this.ready();
    const rows = await this.sql()`
      SELECT data FROM players WHERE puuid = ${puuid}
    `;
    return rows.length ? (rows[0].data as PlayerSnapshot) : null;
  }

  async findPlayerByRiotId(
    platform: string,
    gameName: string,
    tagLine: string
  ): Promise<PlayerSnapshot | null> {
    await this.ready();
    const rows = await this.sql()`
      SELECT data FROM players
      WHERE platform = ${platform.toLowerCase()}
        AND game_name_lower = ${gameName.toLowerCase()}
        AND tag_lower = ${tagLine.toLowerCase()}
      LIMIT 1
    `;
    return rows.length ? (rows[0].data as PlayerSnapshot) : null;
  }

  async listTracked(): Promise<TrackedPlayer[]> {
    await this.ready();
    const rows = await this.sql()`SELECT data FROM tracked`;
    return rows
      .map((r) => r.data as TrackedPlayer)
      .sort((a, b) => a.gameName.localeCompare(b.gameName));
  }

  async setTracked(player: TrackedPlayer, tracked: boolean): Promise<void> {
    await this.ready();
    const sql = this.sql();
    if (tracked) {
      await sql`
        INSERT INTO tracked (puuid, data)
        VALUES (${player.puuid}, ${JSON.stringify(player)}::jsonb)
        ON CONFLICT (puuid) DO UPDATE SET data = EXCLUDED.data
      `;
    } else {
      await sql`DELETE FROM tracked WHERE puuid = ${player.puuid}`;
    }
  }

  async isTracked(puuid: string): Promise<boolean> {
    await this.ready();
    const rows = await this.sql()`
      SELECT 1 AS one FROM tracked WHERE puuid = ${puuid}
    `;
    return rows.length > 0;
  }

  async counts(): Promise<ArchiveCounts> {
    await this.ready();
    const sql = this.sql();
    const [m, p, t] = await Promise.all([
      sql`SELECT count(*)::int AS n FROM matches`,
      sql`SELECT count(*)::int AS n FROM players`,
      sql`SELECT count(*)::int AS n FROM tracked`,
    ]);
    return {
      matches: m[0].n as number,
      players: p[0].n as number,
      tracked: t[0].n as number,
    };
  }
}
