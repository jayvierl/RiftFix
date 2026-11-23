import { NextRequest, NextResponse } from "next/server";
import { getArchive } from "@/lib/archive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Full archived match (scoreboard data) by match id. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const match = await getArchive().getMatch(matchId);
  if (!match) {
    return NextResponse.json(
      { error: "Match not in the Forever archive." },
      { status: 404 }
    );
  }
  return NextResponse.json({ match });
}
