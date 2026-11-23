import { NextResponse } from "next/server";
import { getArchive } from "@/lib/archive";
import { getLatestVersion } from "@/lib/ddragon";
import { hasRiotKey } from "@/lib/riot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const archive = getArchive();
  const [counts, patch] = await Promise.all([
    archive.counts(),
    getLatestVersion().catch(() => null),
  ]);
  return NextResponse.json({
    hasKey: hasRiotKey(),
    patch,
    corpus: counts,
  });
}
