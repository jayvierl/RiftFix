import { NextRequest, NextResponse } from "next/server";
import { getAccountByRiotId, hasRiotKey, RiotError } from "@/lib/riot";
import { getArchive } from "@/lib/archive";
import { getPlatform } from "@/lib/regions";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Light-weight existence check used by the home search form before it
 * navigates to the full profile page. Resolves the Riot ID only — the
 * profile page performs (and archives) the full lookup.
 */
export async function GET(req: NextRequest) {
  if (!rateLimit(`search:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json(
      {
        ok: false,
        code: "rate_limited",
        error: "Too many searches from this connection — wait a moment and try again.",
      },
      { status: 429 }
    );
  }
  const params = req.nextUrl.searchParams;
  const platform = params.get("platform") ?? "na1";
  const gameName = params.get("gameName") ?? "";
  const tagLine = params.get("tagLine") ?? "";
  const info = getPlatform(platform);
  if (!info) {
    return NextResponse.json(
      { ok: false, error: `Unknown region "${platform}".` },
      { status: 400 }
    );
  }
  if (!gameName || !tagLine) {
    return NextResponse.json(
      { ok: false, error: "Enter a Riot ID as gameName#tag." },
      { status: 400 }
    );
  }
  if (!hasRiotKey()) {
    const existing = await getArchive().findPlayerByRiotId(
      info.platform,
      gameName,
      tagLine
    );
    if (existing) {
      return NextResponse.json({
        ok: true,
        fromArchive: true,
        player: {
          gameName: existing.gameName,
          tagLine: existing.tagLine,
          platform: existing.platform,
        },
      });
    }
    return NextResponse.json(
      {
        ok: false,
        code: "no_key",
        error:
          "Player lookup is not configured on this server yet (no Riot API key), and that player isn't in the Forever archive. Champions and other public data still work.",
      },
      { status: 503 }
    );
  }
  try {
    const account = await getAccountByRiotId(info.platform, gameName, tagLine);
    return NextResponse.json({
      ok: true,
      fromArchive: false,
      player: {
        gameName: account.gameName,
        tagLine: account.tagLine,
        platform: info.platform,
      },
    });
  } catch (e) {
    if (e instanceof RiotError) {
      return NextResponse.json(
        { ok: false, code: e.code, error: e.message },
        { status: e.status }
      );
    }
    return NextResponse.json(
      { ok: false, error: "Unexpected error while contacting Riot." },
      { status: 500 }
    );
  }
}
