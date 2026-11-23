import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import TrackToggle from "@/components/TrackToggle";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import SearchForm from "@/components/SearchForm";
import { lookupPlayer } from "@/lib/lookup";
import { RiotError } from "@/lib/riot";
import { getChampions, getLatestVersion, profileIconUrl, championIconUrl } from "@/lib/ddragon";
import { num, pct, titleCase } from "@/lib/format";
import type { PlayerProfile } from "@/lib/lookup";
import type { RankEntry } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const metadata = {
  title: "Player profile — RiftFix",
  description:
    "League of Legends player profile on RiftFix: rank, mastery, archived match history, One Fix and next-rank benchmark.",
  robots: { index: false, follow: true },
};

function RankCard({ title, rank }: { title: string; rank: RankEntry | null }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-slate-800">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p>
      {rank ? (
        <>
          <p className="mt-1 text-xl font-black text-slate-50">
            {titleCase(rank.tier)} {rank.division}
            <span className="ml-2 text-sm font-semibold text-sky-300">{rank.lp} LP</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {rank.wins}W – {rank.losses}L ·{" "}
            {pct(rank.wins / Math.max(rank.wins + rank.losses, 1))} win rate
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm text-slate-400">Unranked this season</p>
      )}
    </div>
  );
}

function ProfileView({ profile, version, champIcons }: {
  profile: PlayerProfile;
  version: string;
  champIcons: Record<number, string>;
}) {
  const s = profile.snapshot;
  const { oneFix, benchmark } = profile;

  return (
    <div>
      {/* Header */}
      <section className="flex flex-wrap items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profileIconUrl(version, s.profileIconId)}
          alt="Profile icon"
          width={72}
          height={72}
          className="rounded-2xl ring-2 ring-sky-400/40"
        />
        <div className="min-w-[200px]">
          <h1 className="text-2xl font-black text-slate-50 sm:text-3xl">
            {s.gameName}
            <span className="text-slate-500">#{s.tagLine}</span>
          </h1>
          <p className="text-sm text-slate-400">
            {profile.platformLabel} · Level {s.summonerLevel} ·{" "}
            {profile.totals.games} archived games ({profile.totals.wins}W –{" "}
            {profile.totals.games - profile.totals.wins}L, {pct(profile.totals.winRate)} WR)
          </p>
        </div>
        <div className="ml-auto">
          <TrackToggle
            puuid={s.puuid}
            platform={s.platform}
            gameName={s.gameName}
            tagLine={s.tagLine}
          />
        </div>
      </section>

      {profile.fromArchiveOnly && (
        <p className="mt-4 rounded-xl bg-amber-400/10 px-4 py-3 text-sm text-amber-200 ring-1 ring-amber-300/25">
          Showing the saved Forever archive copy of this profile — live refresh
          is unavailable because no Riot API key is configured on this server.
          Last live update: {new Date(s.updatedAt).toLocaleString()}.
        </p>
      )}

      {/* Rank + mastery */}
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <RankCard title="Ranked Solo/Duo" rank={s.solo} />
        <RankCard title="Ranked Flex" rank={s.flex} />
        <div className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-slate-800">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Top mastery
          </p>
          {s.mastery.length === 0 ? (
            <p className="mt-1 text-sm text-slate-400">No mastery data yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {s.mastery.map((m) => (
                <li key={m.championId} className="flex items-center gap-2 text-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={champIcons[m.championId] ?? championIconUrl(version, m.championName.replace(/[^A-Za-z]/g, ""))}
                    alt={m.championName}
                    width={24}
                    height={24}
                    className="rounded"
                  />
                  <span className="font-medium text-slate-200">{m.championName}</span>
                  <span className="ml-auto text-xs text-slate-400">
                    Lv {m.level} · {num(m.points)} pts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* One Fix + benchmark */}
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-sky-500/15 to-slate-900/60 p-5 ring-1 ring-sky-400/30">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-sky-300">
              Your One Fix — your biggest lever
            </h2>
            {oneFix.status === "ok" && (
              <span className="text-xs text-slate-400">
                from {oneFix.wins}W / {oneFix.losses}L archived
              </span>
            )}
          </div>
          {oneFix.status === "ok" && oneFix.fix ? (
            <>
              <p className="mt-3 text-lg font-bold leading-snug text-slate-50">
                {oneFix.fix.label}:{" "}
                <span className="text-sky-300">{oneFix.fix.format(oneFix.fix.winAvg)}</span>{" "}
                in wins vs{" "}
                <span className="text-red-300">{oneFix.fix.format(oneFix.fix.lossAvg)}</span>{" "}
                in losses
                <span className="ml-2 rounded-full bg-sky-400/15 px-2 py-0.5 text-xs font-semibold text-sky-200">
                  {Math.round(oneFix.fix.gapPct * 100)}% gap
                </span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{oneFix.fix.advice}</p>
              <p className="mt-2 text-xs text-slate-500">
                This is the biggest lever the evidence points to — not a verdict.
                The numbers above are from your own archived games; what you
                change is your call.
              </p>
              {oneFix.comparisons && oneFix.comparisons.length > 1 && (
                <ul className="mt-3 space-y-1 border-t border-white/5 pt-3 text-xs text-slate-400">
                  {oneFix.comparisons.slice(1, 4).map((c) => (
                    <li key={c.stat} className="flex justify-between">
                      <span>{c.label}</span>
                      <span>{Math.round(c.gapPct * 100)}% better in wins</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{oneFix.message}</p>
          )}
        </div>

        <div className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">
              Next-rank benchmark
              {benchmark.nextTierName && (
                <span className="text-amber-300"> · {titleCase(benchmark.nextTierName)}</span>
              )}
            </h2>
            <ConfidenceBadge confidence={benchmark.confidence} samples={benchmark.sampleGames} />
          </div>
          {benchmark.status === "ok" ? (
            <>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="pb-1 font-medium">Stat</th>
                    <th className="pb-1 font-medium">You</th>
                    <th className="pb-1 font-medium">{benchmark.nextTierName ? titleCase(benchmark.nextTierName) : "Next tier"} avg</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmark.rows.map((r) => (
                    <tr key={r.label} className="border-t border-white/5 text-slate-300">
                      <td className="py-1.5">{r.label}</td>
                      <td className="py-1.5 font-semibold text-slate-100">{r.format(r.yours)}</td>
                      <td className="py-1.5">{r.format(r.benchmark)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-slate-500">
                Benchmark computed only from {benchmark.sampleGames} archived
                games from players currently ranked {benchmark.nextTierName ? titleCase(benchmark.nextTierName) : "next tier"} —
                grouped by the tier on each player&apos;s latest RiftFix
                snapshot, so the comparison group is players by their
                current tier.
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{benchmark.message}</p>
          )}
        </div>
      </section>

      {/* Champion stats + pool/session patterns */}
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">
            Champion stats <span className="font-normal text-slate-500">(archived games)</span>
          </h2>
          {profile.championStats.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No archived games yet.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="pb-1 font-medium">Champion</th>
                  <th className="pb-1 font-medium">Games</th>
                  <th className="pb-1 font-medium">Win rate</th>
                  <th className="pb-1 font-medium">Avg KDA</th>
                </tr>
              </thead>
              <tbody>
                {profile.championStats.slice(0, 10).map((c) => (
                  <tr key={c.championId} className="border-t border-white/5 text-slate-300">
                    <td className="py-1.5">
                      <span className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={champIcons[c.championId] ?? ""} alt={c.championName} width={24} height={24} className="rounded" />
                        <span className="font-medium text-slate-100">{c.championName}</span>
                      </span>
                    </td>
                    <td className="py-1.5">{c.games}</td>
                    <td className="py-1.5">{pct(c.winRate)}</td>
                    <td className="py-1.5">{c.kda.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-4 border-t border-white/5 pt-3 text-sm text-slate-400">
            <p>
              <span className="font-semibold text-slate-200">Champion pool:</span>{" "}
              {profile.pool.distinctChampions} champions across {profile.pool.totalGames} games ·{" "}
              {pct(profile.pool.top3Share)} of games on your top 3
              {profile.pool.top3WinRate !== null &&
                ` (${pct(profile.pool.top3WinRate)} WR on them${profile.pool.restWinRate !== null ? `, ${pct(profile.pool.restWinRate)} on everything else` : ""})`}
              .
            </p>
            <p className="mt-1">{profile.pool.note}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">
            Session patterns
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-800/60 p-3">
              <p className="text-xs text-slate-400">After a win</p>
              <p className="mt-1 text-lg font-bold text-slate-100">
                {pct(profile.sessions.afterWin.winRate)}
                <span className="ml-1 text-xs font-normal text-slate-500">
                  ({profile.sessions.afterWin.games} games)
                </span>
              </p>
            </div>
            <div className="rounded-xl bg-slate-800/60 p-3">
              <p className="text-xs text-slate-400">After a loss</p>
              <p className="mt-1 text-lg font-bold text-slate-100">
                {pct(profile.sessions.afterLoss.winRate)}
                <span className="ml-1 text-xs font-normal text-slate-500">
                  ({profile.sessions.afterLoss.games} games)
                </span>
              </p>
            </div>
          </div>
          {profile.sessions.byGameNumber.length > 0 && (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="pb-1 font-medium">Game # in session</th>
                  <th className="pb-1 font-medium">Games</th>
                  <th className="pb-1 font-medium">Win rate</th>
                </tr>
              </thead>
              <tbody>
                {profile.sessions.byGameNumber.map((r) => (
                  <tr key={r.n} className="border-t border-white/5 text-slate-300">
                    <td className="py-1.5">Game {r.n}</td>
                    <td className="py-1.5">{r.games}</td>
                    <td className="py-1.5">{pct(r.winRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-3 text-sm text-slate-400">{profile.sessions.note}</p>
          <p className="mt-1 text-xs text-slate-500">
            A session is a run of games with less than 45 minutes between them.
          </p>
        </div>
      </section>

      {/* Match history */}
      <section className="mt-6">
        <h2 className="text-lg font-bold text-slate-100">
          Recent matches{" "}
          <span className="text-sm font-normal text-slate-500">
            — kept in your Forever archive, tap a match for the full scoreboard
          </span>
        </h2>
        {profile.matches.length === 0 ? (
          <p className="mt-3 rounded-xl bg-slate-900/60 px-4 py-4 text-sm text-slate-400 ring-1 ring-slate-800">
            No matches archived for this player yet.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {profile.matches.map((m) => (
              <MatchCard key={m.matchId} match={m} puuid={s.puuid} version={version} champIcons={champIcons} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default async function PlayerPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; gameName?: string; tagLine?: string }>;
}) {
  const params = await searchParams;
  const platform = params.platform ?? "na1";
  const gameName = params.gameName ?? "";
  const tagLine = params.tagLine ?? "";

  if (!gameName || !tagLine) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <h1 className="text-2xl font-black text-slate-50">Find a player</h1>
        <p className="mt-2 text-sm text-slate-400">
          Search by Riot ID to see a profile.
        </p>
        <div className="mt-6">
          <SearchForm defaultPlatform={platform} />
        </div>
      </div>
    );
  }

  const version = await getLatestVersion().catch(() => "15.1.1");
  const { champions } = await getChampions().catch(() => ({ champions: [] as Awaited<ReturnType<typeof getChampions>>["champions"] }));
  const champIcons: Record<number, string> = {};
  for (const c of champions) champIcons[c.numericId] = c.iconUrl;

  // Assign inside try/catch and return JSX afterwards: constructing JSX in
  // a try block can't catch render errors anyway (that's what error.tsx is
  // for) and trips the react-hooks/error-boundaries lint rule.
  let profile: PlayerProfile | null = null;
  let errorMessage: string | null = null;
  try {
    profile = await lookupPlayer(platform, gameName, tagLine);
  } catch (e) {
    errorMessage =
      e instanceof RiotError
        ? e.message
        : "Something went wrong loading this profile. Please try again.";
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <h1 className="text-2xl font-black text-slate-50">
          {gameName}
          <span className="text-slate-500">#{tagLine}</span>
        </h1>
        <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-400/25">
          {errorMessage ?? "Something went wrong loading this profile. Please try again."}
        </p>
        <div className="mt-6">
          <SearchForm defaultPlatform={platform} />
        </div>
        <p className="mt-6 text-sm text-slate-500">
          <Link href="/" className="text-sky-400 hover:underline">
            ← Back to RiftFix home
          </Link>
        </p>
      </div>
    );
  }

  return <ProfileView profile={profile} version={version} champIcons={champIcons} />;
}
