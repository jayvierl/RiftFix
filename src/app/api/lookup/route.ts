import { NextRequest, NextResponse } from "next/server";
import { lookupPlayer } from "@/lib/lookup";
import { RiotError } from "@/lib/riot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Full player lookup (archives every fetched match permanently). */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const platform = params.get("platform") ?? "na1";
  const gameName = params.get("gameName") ?? "";
  const tagLine = params.get("tagLine") ?? "";
  if (!gameName || !tagLine) {
    return NextResponse.json(
      { ok: false, error: "gameName and tagLine are required." },
      { status: 400 }
    );
  }
  try {
    const profile = await lookupPlayer(platform, gameName, tagLine);
    return NextResponse.json({ ok: true, profile });
  } catch (e) {
    if (e instanceof RiotError) {
      return NextResponse.json(
        { ok: false, code: e.code, error: e.message },
        { status: e.status }
      );
    }
    return NextResponse.json(
      { ok: false, error: "Unexpected error during lookup." },
      { status: 500 }
    );
  }
}
