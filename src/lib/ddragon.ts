/**
 * Data Dragon client — Riot's public static data CDN. No API key required.
 * Responses are cached (module memo + Next fetch cache with daily revalidate).
 */

const DDRAGON = "https://ddragon.leagueoflegends.com";

export interface ChampionSummary {
  /** Data Dragon string id, e.g. "Aatrox" — used in URLs and image paths. */
  id: string;
  /** Numeric champion id as a string, e.g. "266". */
  key: string;
  numericId: number;
  name: string;
  title: string;
  tags: string[];
  partype: string;
  blurb: string;
  iconUrl: string;
}

export interface ChampionSpell {
  id: string;
  name: string;
  description: string;
  cooldownBurn: string;
  costBurn: string;
  imageUrl: string;
}

export interface ChampionDetail extends ChampionSummary {
  lore: string;
  allytips: string[];
  enemytips: string[];
  passive: { name: string; description: string; imageUrl: string };
  spells: ChampionSpell[];
  stats: Record<string, number>;
  splashUrl: string;
}

interface RawChampion {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  lore?: string;
  allytips?: string[];
  enemytips?: string[];
  tags: string[];
  partype: string;
  stats: Record<string, number>;
  passive?: { name: string; description: string; image: { full: string } };
  spells?: Array<{
    id: string;
    name: string;
    description: string;
    cooldownBurn: string;
    costBurn: string;
    image: { full: string };
  }>;
}

const VERSION_TTL_MS = 60 * 60 * 1000; // 1h — new patches land ~fortnightly
let versionCache: { version: string; fetchedAt: number } | null = null;

export async function getLatestVersion(): Promise<string> {
  if (versionCache && Date.now() - versionCache.fetchedAt < VERSION_TTL_MS) {
    return versionCache.version;
  }
  const res = await fetch(`${DDRAGON}/api/versions.json`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Data Dragon versions failed: ${res.status}`);
  const versions = (await res.json()) as string[];
  if (!Array.isArray(versions) || versions.length === 0) {
    throw new Error("Data Dragon versions response was empty.");
  }
  versionCache = { version: versions[0], fetchedAt: Date.now() };
  return versionCache.version;
}

export function championIconUrl(version: string, championId: string): string {
  return `${DDRAGON}/cdn/${version}/img/champion/${championId}.png`;
}

export function profileIconUrl(version: string, iconId: number): string {
  return `${DDRAGON}/cdn/${version}/img/profileicon/${iconId}.png`;
}

export function itemIconUrl(version: string, itemId: number): string {
  return `${DDRAGON}/cdn/${version}/img/item/${itemId}.png`;
}

let championsCache: { version: string; list: ChampionSummary[] } | null = null;

export async function getChampions(): Promise<{
  version: string;
  champions: ChampionSummary[];
}> {
  const version = await getLatestVersion();
  if (championsCache && championsCache.version === version) {
    return { version, champions: championsCache.list };
  }
  const res = await fetch(`${DDRAGON}/cdn/${version}/data/en_US/champion.json`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Data Dragon champions failed: ${res.status}`);
  const json = (await res.json()) as { data: Record<string, RawChampion> };
  const champions = Object.values(json.data)
    .map((c) => ({
      id: c.id,
      key: c.key,
      numericId: Number(c.key),
      name: c.name,
      title: c.title,
      tags: c.tags,
      partype: c.partype,
      blurb: c.blurb,
      iconUrl: championIconUrl(version, c.id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  championsCache = { version, list: champions };
  return { version, champions };
}

export async function getChampionByNumericId(
  numericId: number
): Promise<ChampionSummary | null> {
  const { champions } = await getChampions();
  return champions.find((c) => c.numericId === numericId) ?? null;
}

export async function getChampionDetail(
  id: string
): Promise<{ version: string; champion: ChampionDetail } | null> {
  // Validate against the known champion id set first: an arbitrary id would
  // otherwise be interpolated straight into the Data Dragon URL.
  const { champions } = await getChampions();
  if (!champions.some((c) => c.id === id)) return null;
  const version = await getLatestVersion();
  const res = await fetch(
    `${DDRAGON}/cdn/${version}/data/en_US/champion/${id}.json`,
    { next: { revalidate: 86400 } }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Data Dragon champion detail failed: ${res.status}`);
  const json = (await res.json()) as { data: Record<string, RawChampion> };
  const raw = json.data[id];
  if (!raw) return null;
  const summary: ChampionSummary = {
    id: raw.id,
    key: raw.key,
    numericId: Number(raw.key),
    name: raw.name,
    title: raw.title,
    tags: raw.tags,
    partype: raw.partype,
    blurb: raw.blurb,
    iconUrl: championIconUrl(version, raw.id),
  };
  return {
    version,
    champion: {
      ...summary,
      lore: raw.lore ?? raw.blurb,
      allytips: raw.allytips ?? [],
      enemytips: raw.enemytips ?? [],
      passive: {
        name: raw.passive?.name ?? "",
        description: raw.passive?.description ?? "",
        imageUrl: raw.passive
          ? `${DDRAGON}/cdn/${version}/img/passive/${raw.passive.image.full}`
          : "",
      },
      spells: (raw.spells ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        cooldownBurn: s.cooldownBurn,
        costBurn: s.costBurn,
        imageUrl: `${DDRAGON}/cdn/${version}/img/spell/${s.image.full}`,
      })),
      stats: raw.stats,
      splashUrl: `${DDRAGON}/cdn/img/champion/splash/${raw.id}_0.jpg`,
    },
  };
}

export interface ItemInfo {
  name: string;
  plaintext: string;
}

let itemsCache: { version: string; items: Record<string, ItemInfo> } | null =
  null;

export async function getItems(): Promise<{
  version: string;
  items: Record<string, ItemInfo>;
}> {
  const version = await getLatestVersion();
  if (itemsCache && itemsCache.version === version) return itemsCache;
  const res = await fetch(`${DDRAGON}/cdn/${version}/data/en_US/item.json`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Data Dragon items failed: ${res.status}`);
  const json = (await res.json()) as {
    data: Record<string, { name: string; plaintext?: string }>;
  };
  const items: Record<string, ItemInfo> = {};
  for (const [id, item] of Object.entries(json.data)) {
    items[id] = { name: item.name, plaintext: item.plaintext ?? "" };
  }
  itemsCache = { version, items };
  return itemsCache;
}

/** Small static map for keystone names (Data Dragon runesReforged is heavy;
 *  we resolve the ones we display through it, cached). */
let runeNamesCache: Record<number, string> | null = null;

export async function getRuneNames(): Promise<Record<number, string>> {
  if (runeNamesCache) return runeNamesCache;
  const version = await getLatestVersion();
  const res = await fetch(
    `${DDRAGON}/cdn/${version}/data/en_US/runesReforged.json`,
    { next: { revalidate: 86400 } }
  );
  const names: Record<number, string> = {};
  if (res.ok) {
    const trees = (await res.json()) as Array<{
      id: number;
      name: string;
      slots: Array<{ runes: Array<{ id: number; name: string }> }>;
    }>;
    for (const tree of trees) {
      names[tree.id] = tree.name;
      for (const slot of tree.slots) {
        for (const rune of slot.runes) names[rune.id] = rune.name;
      }
    }
  }
  // Cache only a successful, non-empty result — a failed fetch must not
  // poison the cache with an empty map for the life of the process.
  if (Object.keys(names).length > 0) {
    runeNamesCache = names;
  }
  return names;
}
