import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { getArchive } from "@/lib/archive";
import { computeOneFix, playerStatLines } from "@/lib/analysis";
import { MATCHES_PER_LOOKUP } from "@/lib/lookup";
import { getPlatform } from "@/lib/regions";
import { titleCase } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tier accent colours for the card's rank block. */
const TIER_COLORS: Record<string, string> = {
  IRON: "#9a8f8a",
  BRONZE: "#c08a4e",
  SILVER: "#aebfd1",
  GOLD: "#f0b93e",
  PLATINUM: "#3ec6b8",
  EMERALD: "#3ddc84",
  DIAMOND: "#7aa5f8",
  MASTER: "#c77dff",
  GRANDMASTER: "#ff5d73",
  CHALLENGER: "#f4e2a0",
};

/**
 * Shareable 1200×630 season card (PNG), rendered ONLY from the Forever
 * archive — this route never calls the Riot API. A player who has never
 * been looked up gets an honest 404 JSON, not an invented card.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const platform = params.get("platform") ?? "";
  const gameName = params.get("gameName") ?? "";
  const tagLine = params.get("tagLine") ?? "";

  if (!platform || !gameName || !tagLine) {
    return NextResponse.json(
      { ok: false, error: "platform, gameName and tagLine are required." },
      { status: 400 }
    );
  }
  const info = getPlatform(platform);
  if (!info) {
    return NextResponse.json(
      { ok: false, error: `Unknown region "${platform}".` },
      { status: 400 }
    );
  }

  const archive = getArchive();
  const snapshot = await archive.findPlayerByRiotId(
    info.platform,
    gameName,
    tagLine
  );
  if (!snapshot) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "This player is not in the Forever archive yet — look them up on RiftFix first, then the card can be rendered.",
      },
      { status: 404 }
    );
  }

  const matches = await archive.listMatchesForPlayer(
    snapshot.puuid,
    MATCHES_PER_LOOKUP
  );
  const oneFix = computeOneFix(playerStatLines(matches, snapshot.puuid));
  const rank = snapshot.solo ?? snapshot.flex;
  const tierColor = rank
    ? (TIER_COLORS[rank.tier.toUpperCase()] ?? "#e6edf7")
    : "#94a3b8";
  const topMastery = snapshot.mastery[0] ?? null;
  const oneFixText =
    oneFix.status === "ok" && oneFix.fix
      ? `${oneFix.fix.label}: ${oneFix.fix.format(oneFix.fix.winAvg)} in wins vs ${oneFix.fix.format(oneFix.fix.lossAvg)} in losses (${Math.round(oneFix.fix.gapPct * 100)}% gap)`
      : "One Fix: still gathering games";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0B0E14",
          backgroundImage:
            "linear-gradient(120deg, rgba(34,211,238,0.14) 0%, rgba(11,14,20,0) 45%, rgba(139,92,246,0.12) 100%)",
          color: "#e6edf7",
          padding: "46px 60px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", fontSize: 38, fontWeight: 900 }}>
            <span style={{ color: "#f8fafc" }}>Rift</span>
            <span style={{ color: "#22d3ee" }}>Fix</span>
          </div>
          <div
            style={{
              fontSize: 17,
              letterSpacing: 4,
              color: "#94a3b8",
              textTransform: "uppercase",
            }}
          >
            Season card
          </div>
        </div>

        {/* Player */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 900, color: "#f8fafc" }}>
            {snapshot.gameName}
            <span style={{ color: "#64748b" }}>#{snapshot.tagLine}</span>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#94a3b8", marginTop: 6 }}>
            {info.label} · Level {snapshot.summonerLevel} ·{" "}
            {matches.length} archived games
          </div>
        </div>

        {/* Rank + mastery */}
        <div style={{ display: "flex", marginTop: 30, alignItems: "stretch" }}>
          <div style={{ display: "flex", flexDirection: "column", width: 480 }}>
            <div
              style={{
                fontSize: 16,
                letterSpacing: 3,
                color: "#94a3b8",
                textTransform: "uppercase",
              }}
            >
              {snapshot.solo ? "Ranked Solo/Duo" : snapshot.flex ? "Ranked Flex" : "Ranked"}
            </div>
            {rank ? (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 8 }}>
                <div style={{ display: "flex", fontSize: 54, fontWeight: 900, color: tierColor }}>
                  {titleCase(rank.tier)} {rank.division}
                  <span style={{ color: "#e6edf7", fontSize: 34, marginLeft: 16, marginTop: 14 }}>
                    {rank.lp} LP
                  </span>
                </div>
                <div style={{ display: "flex", fontSize: 22, color: "#cbd5e1", marginTop: 4 }}>
                  {rank.wins}W – {rank.losses}L ·{" "}
                  {Math.round(
                    (rank.wins / Math.max(rank.wins + rank.losses, 1)) * 100
                  )}
                  % win rate
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#94a3b8", marginTop: 10 }}>
                Unranked this season
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              width: 1,
              backgroundColor: "rgba(148,163,184,0.25)",
              marginLeft: 12,
              marginRight: 44,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 16,
                letterSpacing: 3,
                color: "#94a3b8",
                textTransform: "uppercase",
              }}
            >
              Top mastery
            </div>
            {topMastery ? (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 8 }}>
                <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: "#f8fafc" }}>
                  {topMastery.championName}
                </div>
                <div style={{ display: "flex", fontSize: 22, color: "#cbd5e1", marginTop: 4 }}>
                  Level {topMastery.level} ·{" "}
                  {topMastery.points.toLocaleString("en-US")} points
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", fontSize: 26, color: "#94a3b8", marginTop: 12 }}>
                No mastery data yet
              </div>
            )}
          </div>
        </div>

        {/* One Fix */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 30,
            backgroundColor: "rgba(34,211,238,0.08)",
            border: "1px solid rgba(34,211,238,0.30)",
            borderRadius: 18,
            padding: "20px 26px",
          }}
        >
          <div
            style={{
              fontSize: 15,
              letterSpacing: 3,
              color: "#7dd3fc",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Your One Fix
          </div>
          <div style={{ display: "flex", fontSize: 27, fontWeight: 600, color: "#f1f5f9", marginTop: 6 }}>
            {oneFixText}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "auto",
            fontSize: 19,
            color: "#64748b",
          }}
        >
          <span>riftfix.vercel.app</span>
          <span>My League, Forever</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "private, max-age=300" },
    }
  );
}
