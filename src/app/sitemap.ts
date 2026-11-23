import type { MetadataRoute } from "next";
import { getChampions } from "@/lib/ddragon";

export const runtime = "nodejs";
export const revalidate = 86400;

function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/champions`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/builds`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
  try {
    const { champions } = await getChampions();
    const championPages: MetadataRoute.Sitemap = champions.map((c) => ({
      url: `${base}/champions/${c.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
    return [...staticPages, ...championPages];
  } catch {
    return staticPages;
  }
}
