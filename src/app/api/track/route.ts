import { NextRequest, NextResponse } from "next/server";
import { getArchive } from "@/lib/archive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mark / unmark a looked-up player as a tracked account. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    puuid?: string;
    tracked?: boolean;
  } | null;
  if (!body?.puuid || typeof body.tracked !== "boolean") {
    return NextResponse.json(
      { ok: false, error: "puuid and tracked are required." },
      { status: 400 }
    );
  }
  const archive = getArchive();
  const snapshot = await archive.getPlayerSnapshot(body.puuid);
  if (!snapshot) {
    return NextResponse.json(
      { ok: false, error: "Player not found in the archive. Look them up first." },
      { status: 404 }
    );
  }
  await archive.setTracked(
    {
      puuid: snapshot.puuid,
      platform: snapshot.platform,
      gameName: snapshot.gameName,
      tagLine: snapshot.tagLine,
      trackedAt: new Date().toISOString(),
    },
    body.tracked
  );
  return NextResponse.json({ ok: true, tracked: body.tracked });
}
