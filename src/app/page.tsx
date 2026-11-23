import Image from "next/image";
import { Infinity as InfinityIcon, Scale, Target } from "lucide-react";
import SearchForm from "@/components/SearchForm";
import TrackedPlayers from "@/components/TrackedPlayers";
import CorpusTicker from "@/components/CorpusTicker";
import AnimatedNumber from "@/components/AnimatedNumber";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion-primitives";
import { getArchive } from "@/lib/archive";
import { getChampions, getLatestVersion } from "@/lib/ddragon";
import { hasRiotKey } from "@/lib/riot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const archive = getArchive();
  const [counts, patch, championsData] = await Promise.all([
    archive.counts(),
    getLatestVersion().catch(() => null),
    getChampions().catch(() => null),
  ]);
  const championsCount = championsData?.champions.length ?? null;
  const keyConfigured = hasRiotKey();

  return (
    <div>
      <CorpusTicker
        initialMatches={counts.matches}
        initialPlayers={counts.players}
        initialPatch={patch}
        championsCount={championsCount}
      />
      <div className="relative -mx-4 mb-2 overflow-hidden">
        <div className="relative h-44 w-full sm:h-60">
          <Image
            src="/hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-70"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#070b14]" />
      </div>
      <section className="py-8 text-center sm:py-12">
        <StaggerGroup>
          <StaggerItem>
            <h1 className="text-4xl font-black tracking-tight text-slate-50 sm:text-5xl">
              Fix the one thing
              <br className="sm:hidden" />{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">
                losing you games.
              </span>
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
              RiftFix looks up any League player, archives their matches{" "}
              <em className="text-slate-200 not-italic underline decoration-amber-300/60 underline-offset-4">
                forever
              </em>
              , and turns them into one honest fix — plus builds computed only from
              real archived games, with the sample size printed next to every claim.
            </p>
          </StaggerItem>
          <StaggerItem>
            <div className="mx-auto mt-8 max-w-2xl">
              <SearchForm autoFocus />
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-start justify-center gap-x-10 gap-y-4">
              <div>
                <p className="text-2xl font-black tabular-nums text-slate-50">
                  <AnimatedNumber value={counts.matches} />
                </p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  Matches in the Forever archive
                </p>
              </div>
              <div>
                <p className="text-2xl font-black tabular-nums text-slate-50">
                  <AnimatedNumber value={counts.players} />
                </p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  Players archived
                </p>
              </div>
              {championsCount !== null && (
                <div>
                  <p className="text-2xl font-black tabular-nums text-slate-50">
                    <AnimatedNumber value={championsCount} />
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    Champions
                  </p>
                </div>
              )}
              {patch && (
                <div>
                  <p className="text-2xl font-black tabular-nums text-slate-50">{patch}</p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    Live patch
                  </p>
                </div>
              )}
            </div>
          </StaggerItem>
        </StaggerGroup>
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

      <StaggerGroup className="grid gap-4 pb-10 sm:grid-cols-3">
        <StaggerItem className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-slate-800">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-sky-300">
            <Target className="h-4 w-4" /> One Fix
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Not a wall of stats — the single biggest difference between your
            wins and your losses, and whether you actually fixed it next time
            out.
          </p>
        </StaggerItem>
        <StaggerItem className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-slate-800">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-sky-300">
            <Scale className="h-4 w-4" /> Honest Builds
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Builds and tier lists computed only from games RiftFix has really
            archived — every number ships with its sample size and a
            Solid / Promising / Too early confidence badge.
          </p>
        </StaggerItem>
        <StaggerItem className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-slate-800">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-sky-300">
            <InfinityIcon className="h-4 w-4" /> My League, Forever
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Other sites delete your history after a few months. RiftFix keeps
            every match it fetches, permanently, so your trends never evaporate.
          </p>
        </StaggerItem>
      </StaggerGroup>

      <Reveal>
        <TrackedPlayers />
      </Reveal>
    </div>
  );
}
