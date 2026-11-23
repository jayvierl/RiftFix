import SearchForm from "@/components/SearchForm";
import TrackedPlayers from "@/components/TrackedPlayers";
import { getArchive } from "@/lib/archive";
import { getLatestVersion } from "@/lib/ddragon";
import { hasRiotKey } from "@/lib/riot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const archive = getArchive();
  const [counts, patch] = await Promise.all([
    archive.counts(),
    getLatestVersion().catch(() => null),
  ]);
  const keyConfigured = hasRiotKey();

  return (
    <div>
      <div className="relative -mx-4 -mt-6 mb-2 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero.jpg"
          alt=""
          className="h-44 w-full object-cover object-center opacity-70 sm:h-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#070b14]" />
      </div>
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

      <TrackedPlayers />
    </div>
  );
}
