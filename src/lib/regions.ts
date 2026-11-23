/**
 * Platform -> regional routing map for the Riot API.
 *
 * Platform hosts (Summoner-V4, League-V4, Champion-Mastery-V4) look like
 *   https://{platform}.api.riotgames.com
 * Regional hosts (Account-V1, Match-V5) look like
 *   https://{region}.api.riotgames.com
 */

export type RegionalRoute = "americas" | "europe" | "asia" | "sea";

export interface PlatformInfo {
  /** Platform routing value, e.g. "na1" (used in platform-host URLs). */
  platform: string;
  /** Regional routing value for Account-V1 / Match-V5. */
  region: RegionalRoute;
  /** Human-readable label for the UI. */
  label: string;
}

export const PLATFORMS: Record<string, PlatformInfo> = {
  na1: { platform: "na1", region: "americas", label: "North America" },
  br1: { platform: "br1", region: "americas", label: "Brazil" },
  la1: { platform: "la1", region: "americas", label: "Latin America North" },
  la2: { platform: "la2", region: "americas", label: "Latin America South" },
  euw1: { platform: "euw1", region: "europe", label: "Europe West" },
  eun1: { platform: "eun1", region: "europe", label: "Europe Nordic & East" },
  tr1: { platform: "tr1", region: "europe", label: "Türkiye" },
  ru: { platform: "ru", region: "europe", label: "Russia" },
  me1: { platform: "me1", region: "europe", label: "Middle East" },
  kr: { platform: "kr", region: "asia", label: "Korea" },
  jp1: { platform: "jp1", region: "asia", label: "Japan" },
  oc1: { platform: "oc1", region: "sea", label: "Oceania" },
  ph2: { platform: "ph2", region: "sea", label: "Philippines" },
  sg2: { platform: "sg2", region: "sea", label: "Singapore" },
  th2: { platform: "th2", region: "sea", label: "Thailand" },
  tw2: { platform: "tw2", region: "sea", label: "Taiwan" },
  vn2: { platform: "vn2", region: "sea", label: "Vietnam" },
};

export const PLATFORM_LIST: PlatformInfo[] = Object.values(PLATFORMS);

export function getPlatform(platform: string): PlatformInfo | null {
  return PLATFORMS[platform.toLowerCase()] ?? null;
}

export function platformHost(platform: string): string {
  return `https://${platform.toLowerCase()}.api.riotgames.com`;
}

export function regionalHost(region: RegionalRoute): string {
  return `https://${region}.api.riotgames.com`;
}
