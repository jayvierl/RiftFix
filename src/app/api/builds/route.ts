import { NextResponse } from "next/server";
import { getArchive } from "@/lib/archive";
import { computeBuilds, computeTierList } from "@/lib/analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Honest Builds + tier list, computed only from the archived match corpus. */
export async function GET() {
  const archive = getArchive();
  const matches = await archive.allMatches();
  return NextResponse.json({
    corpusGames: matches.length,
    builds: computeBuilds(matches),
    tierList: computeTierList(matches),
  });
}
