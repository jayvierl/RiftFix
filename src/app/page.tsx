import Link from "next/link";
import SearchForm from "@/components/SearchForm";
import { getArchive } from "@/lib/archive";
import { getLatestVersion } from "@/lib/ddragon";
import { hasRiotKey } from "@/lib/riot";
import { getPlatform } from "@/lib/regions";
import { profilePath } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const archive = getArchive();
  const [counts, tracked, patch] = await Promise.all([
    archive.counts(),
    archive.listTracked(),
    getLatestVersion().catch(() => null),
  ]);
  const keyConfigured = hasRiotKey();

  return (
    <div>
      <section className="py-8 text-center sm:py-12">
        <h1 className="text-4xl font-black tracking-tight text-slate-50 sm:text-5xl">
          Fix the one thing
          <br className="sm:hidden" />{" "}
          <span className="text-sky-400">losing you games.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
          RiftFix looks up any League player, archives their matches{" "}
          <em className="text-slate-200 not-italic underline decoration-amber-300/60 underline-offset-4">
            forever
          </em>
          , and turns them into one honest fix — plus builds computed only from
          real archived games, with the sample size printed next to every claim.
        </p>
        <div className="mx-auto mt-8 max-w-2xl">
          <SearchForm autoFocus />
        </div>
        {patch && (
          <p className="mt-3 text-xs text-slate-500">
            Live patch <span className="font-semibold text-slate-300">{patch}</span> ·{" "}
            {counts.matches} matches in the Forever archive · {counts.players} players archived
          </p>
        )}
        {!keyConfigured && (
          <div className="mx-auto mt-6 max-w-2xl rounded-xl bg-amber-400/10 px-4 py-3 text-left text-sm text-amber-200 ring-1 ring-amber-300/25">
            <strong className="font-semibold">Player lookup is not configured yet.</strong>{" "}
            This server has no Riot API key set (<code className="font-mono text-xs">RIOT_API_KEY</code>),
            so live lookups are paused. Champions and other public data work
            normally, and any player already in the Forever archive can still
            be viewed.
          </div>
        )}
      </section>

      <section className="grid gap-4 pb-10 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-wide text-sky-300">One Fix</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Not a wall of stats — the single biggest difference between your
            wins and your losses, and whether you actually fixed it next time
            out.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-wide text-sky-300">Honest Builds</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Builds and tier lists computed only from games RiftFix has really
            archived — every number ships with its sample size and a
            Solid / Promising / Too early confidence badge.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-wide text-sky-300">My League, Forever</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Other sites delete your history after a few months. RiftFix keeps
            every match it fetches, permanently, so your trends never evaporate.
          </p>
        </div>
      </section>

      <section className="pb-12">
        <h2 className="text-lg font-bold text-slate-100">Tracked accounts</h2>
        {tracked.length === 0 ? (
          <p className="mt-2 rounded-xl bg-slate-900/60 px-4 py-4 text-sm text-slate-400 ring-1 ring-slate-800">
            No tracked accounts yet. Look up a player and tap{" "}
            <span className="text-amber-300">“☆ Track this account”</span> on
            their profile — tracked accounts live here and anchor your Forever
            archive.
          </p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {tracked.map((p) => (
              <Link
                key={p.puuid}
                href={profilePath(p.platform, p.gameName, p.tagLine)}
                className="flex items-center justify-between rounded-xl bg-slate-900/60 px-4 py-3 ring-1 ring-slate-800 transition hover:ring-amber-300/40"
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-100">
                    {p.gameName}
                    <span className="text-slate-500">#{p.tagLine}</span>
                  </span>
                  <span className="block text-xs text-slate-500">
                    {getPlatform(p.platform)?.label ?? p.platform}
                  </span>
                </span>
                <span className="text-amber-300">★</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
