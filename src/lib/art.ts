/**
 * Art URLs for League assets that Data Dragon doesn't carry (or carries
 * in a less dramatic form). Primary source: the CommunityDragon raw CDN —
 * community-maintained extraction of live client files, always via its
 * `latest` path. Every CommunityDragon URL here is a progressive
 * enhancement: components must fall back to Data Dragon art (or hide the
 * image) on error, because the CDN is a community service.
 *
 * URL patterns verified live on 2026-11-23:
 * - Champion splash (centered):
 *   .../assets/characters/<alias>/skins/base/images/<alias>_splash_centered_0.jpg
 *   (from the `splashPath` field of /v1/champions/<numericId>.json,
 *   lowercased onto the raw CDN path) — HTTP 200 for Ashe and Renata.
 * - Rank emblems (single-file composite, "{tier}_baseface_matte.png"):
 *   .../content/src/leagueclient/rankedcrests/<NN>_<tier>/images/<tier>_baseface_matte.png
 *   — HTTP 200 verified for iron/gold/diamond/master/challenger.
 *   NOTE: that crest set predates Emerald — there is no emerald folder,
 *   so EMERALD intentionally maps to null (text-only rank display).
 */

const CDRAGON =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default";
const DDRAGON = "https://ddragon.leagueoflegends.com";

/**
 * CommunityDragon champion alias (lowercased path segment). Verified
 * 2026-11-23 against /v1/champions/<id>.json: the CDragon alias matches
 * the Data Dragon id for every champion checked — including the usual
 * suspect MonkeyKing (alias is "MonkeyKing" on both CDNs, NOT "Wukong").
 * The override map stays as an escape hatch; any residual mismatch just
 * 404s and SplashArt falls back to Data Dragon art.
 */
const CDRAGON_ALIAS_OVERRIDES: Record<string, string> = {};

export function cdragonAlias(dataDragonId: string): string {
  return CDRAGON_ALIAS_OVERRIDES[dataDragonId] ?? dataDragonId.toLowerCase();
}

/** Full-bleed centered splash art from CommunityDragon (base skin). */
export function cdragonSplashUrl(dataDragonId: string): string {
  const alias = cdragonAlias(dataDragonId);
  return `${CDRAGON}/assets/characters/${alias}/skins/base/images/${alias}_splash_centered_0.jpg`;
}

/** Data Dragon splash art — the reliable fallback for the CDragon splash. */
export function ddragonSplashUrl(dataDragonId: string): string {
  return `${DDRAGON}/cdn/img/champion/splash/${dataDragonId}_0.jpg`;
}

/** Data Dragon loading-screen art (portrait) — used on champion grid cards. */
export function ddragonLoadingUrl(dataDragonId: string): string {
  return `${DDRAGON}/cdn/img/champion/loading/${dataDragonId}_0.jpg`;
}

const RANK_CREST_FOLDERS: Record<string, string> = {
  IRON: "01_iron",
  BRONZE: "02_bronze",
  SILVER: "03_silver",
  GOLD: "04_gold",
  PLATINUM: "05_platinum",
  DIAMOND: "06_diamond",
  MASTER: "07_master",
  GRANDMASTER: "08_grandmaster",
  CHALLENGER: "09_challenger",
  // EMERALD: deliberately absent — the CommunityDragon crest set has no
  // emerald emblem; RankEmblem renders nothing and the tier text stands.
};

/**
 * Single-file rank emblem (helmet crest) from CommunityDragon, or null
 * when the tier has no emblem (unranked / EMERALD / unknown tier).
 */
export function rankEmblemUrl(tier: string | null | undefined): string | null {
  if (!tier) return null;
  const key = tier.toUpperCase();
  const folder = RANK_CREST_FOLDERS[key];
  if (!folder) return null;
  const slug = key.toLowerCase();
  return `${CDRAGON}/content/src/leagueclient/rankedcrests/${folder}/images/${slug}_baseface_matte.png`;
}
