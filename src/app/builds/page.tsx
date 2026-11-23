import Link from "next/link";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { getArchive } from "@/lib/archive";
import { computeBuilds, computeTierList } from "@/lib/analysis";
import { getChampions, getItems, getLatestVersion, getRuneNames, itemIconUrl } from "@/lib/ddragon";
import { pct } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SEO quality gate: the builds/tier page is only indexable once the archive
 * backs it with real data — at least 10 champions with 10+ archived ranked
 * games each. Below that it still renders for users, but as noindex.
 */
const MIN_TIERED_CHAMPIONS_FOR_INDEX = 10;

export async function generateMetadata() {
  const matches = await getArchive().allMatches().catch(() => []);
  const tiered = computeTierList(matches).filter((r) => r.games >= 10).length;
  const indexable = tiered >= MIN_TIERED_CHAMPIONS_FOR_INDEX;
  return {
    title: "Honest Builds & Tier List — RiftFix",
    description:
      "League of Legends builds and tier list computed only from real archived ranked games, with sample sizes and confidence badges on every number.",
    openGraph: {
      title: "Honest Builds & Tier List — RiftFix",
      description:
        "Builds computed only from real archived games — sample size and confidence shown for every claim.",
    },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
  };
}

const TIER_STYLES: Record<string, string> = {
  S: "bg-amber-400 text-slate-900",
  A: "bg-emerald-400 text-slate-900",
  B: "bg-sky-400 text-slate-900",
  C: "bg-slate-400 text-slate-900",
  "—": "bg-slate-700 text-slate-300",
};

const POSITION_LABELS: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "Bot",
  UTILITY: "Support",
  ALL: "Any role",
};

export default async function BuildsPage() {
  const archive = getArchive();
  const matches = await archive.allMatches();
  const builds = computeBuilds(matches);
  const tierList = computeTierList(matches);
  const version = await getLatestVersion().catch(() => "15.1.1");
  const [{ items }, runeNames, { champions }] = await Promise.all([
    getItems().catch(() => ({ items: {} as Record<string, { name: string }> })),
    getRuneNames().catch(() => ({}) as Record<number, string>),
    getChampions().catch(() => ({ champions: [] as Awaited<ReturnType<typeof getChampions>>["champions"] })),
  ]);
  const champIcons: Record<number, string> = {};
  for (const c of champions) champIcons[c.numericId] = c.iconUrl;

  return (
    <div>
      <h1 className="text-3xl font-black text-slate-50">Honest Builds &amp; Tier List</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
        Everything on this page is computed <strong className="text-slate-200">only</strong> from
        ranked matches stored in RiftFix&apos;s Forever archive — currently{" "}
        <strong className="text-slate-200">{matches.length} matches</strong>. No scraped
        data, no invented win rates: every row shows its sample size and a
        confidence badge, and tiers only appear once a champion has at least
        10 archived games.
      </p>

      {matches.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-slate-900/60 px-5 py-8 text-center ring-1 ring-slate-800">
          <p className="text-lg font-bold text-slate-200">The archive is empty — so this page is honestly empty.</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
            RiftFix refuses to fake builds. Look up any player and their ranked
            matches are archived forever; builds and tiers grow from those real
            games, one lookup at a time.
          </p>
          <Link href="/" className="mt-4 inline-block rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-400">
            Look up a player to seed the archive
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-100">Tier list (archived ranked games)</h2>
            <div className="mt-3 overflow-x-auto rounded-2xl ring-1 ring-slate-800">
              <table className="w-full min-w-[560px] bg-slate-900/60 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Tier</th>
                    <th className="px-4 py-3 font-medium">Champion</th>
                    <th className="px-4 py-3 font-medium">Games</th>
                    <th className="px-4 py-3 font-medium">Win rate</th>
                    <th className="px-4 py-3 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {tierList.slice(0, 30).map((row) => (
                    <tr key={row.championId} className="border-t border-white/5 text-slate-300">
                      <td className="px-4 py-2">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded font-black ${TIER_STYLES[row.tier]}`}>
                          {row.tier}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="flex items-center gap-2 font-medium text-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={champIcons[row.championId] ?? ""} alt={row.championName} width={26} height={26} className="rounded" />
                          {row.championName}
                        </span>
                      </td>
                      <td className="px-4 py-2">{row.games}</td>
                      <td className="px-4 py-2">{pct(row.winRate, 1)}</td>
                      <td className="px-4 py-2">
                        <ConfidenceBadge confidence={row.confidence} samples={row.games} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-100">Most common builds by champion &amp; role</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {builds.slice(0, 24).map((b) => (
                <div key={`${b.championId}-${b.position}`} className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-slate-800">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={champIcons[b.championId] ?? ""} alt={b.championName} width={36} height={36} className="rounded-lg" />
                    <div>
                      <p className="text-sm font-bold text-slate-100">
                        {b.championName}
                        <span className="ml-2 text-xs font-medium text-slate-400">
                          {POSITION_LABELS[b.position] ?? b.position}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {b.games} games · {pct(b.winRate, 1)} WR
                      </p>
                    </div>
                    <span className="ml-auto">
                      <ConfidenceBadge confidence={b.confidence} samples={b.games} />
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {b.topItems.map((item) => (
                      <span key={item.itemId} className="group relative" title={`${items[String(item.itemId)]?.name ?? `Item ${item.itemId}`} — in ${pct(item.share)} of games`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={itemIconUrl(version, item.itemId)}
                          alt={items[String(item.itemId)]?.name ?? ""}
                          width={34}
                          height={34}
                          className="rounded-md ring-1 ring-slate-700"
                        />
                        <span className="absolute -bottom-1 -right-1 rounded bg-slate-950/90 px-1 text-[9px] font-semibold text-slate-300">
                          {Math.round(item.share * 100)}%
                        </span>
                      </span>
                    ))}
                    {b.topKeystone && (
                      <span className="ml-2 rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-300 ring-1 ring-violet-400/30">
                        {runeNames[b.topKeystone.runeId] ?? `Rune ${b.topKeystone.runeId}`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {builds.length > 24 && (
              <p className="mt-3 text-xs text-slate-500">
                Showing the 24 most-played champion/role combinations of {builds.length} in the archive.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
