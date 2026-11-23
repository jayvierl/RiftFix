import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChampionDetail, getLatestVersion } from "@/lib/ddragon";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const detail = await getChampionDetail(id).catch(() => null);
  if (!detail) return { title: "Champion not found — RiftFix" };
  const patch = await getLatestVersion().catch(() => "");
  const { champion } = detail;
  const description = `${champion.name}, ${champion.title} — lore, abilities, and base stats on patch ${patch}, plus honest builds from real archived games on RiftFix.`;
  return {
    title: `${champion.name} — ${champion.title} · Patch ${patch} — RiftFix`,
    description,
    openGraph: {
      title: `${champion.name} — RiftFix`,
      description,
      images: [champion.splashUrl],
    },
  };
}

export const runtime = "nodejs";
export const revalidate = 86400;

const KEY_STATS: Array<{ key: string; label: string }> = [
  { key: "hp", label: "Health" },
  { key: "mp", label: "Resource" },
  { key: "armor", label: "Armor" },
  { key: "spellblock", label: "Magic resist" },
  { key: "attackdamage", label: "Attack damage" },
  { key: "attackspeedperlevel", label: "AS / level" },
  { key: "movespeed", label: "Move speed" },
  { key: "attackrange", label: "Attack range" },
];

export default async function ChampionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getChampionDetail(id).catch(() => null);
  if (!detail) notFound();
  const { champion } = detail;

  return (
    <div>
      <Link href="/champions" className="text-sm text-sky-400 hover:underline">
        ← All champions
      </Link>

      <section className="relative mt-4 overflow-hidden rounded-2xl ring-1 ring-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={champion.splashUrl}
          alt={champion.name}
          className="h-56 w-full object-cover object-top sm:h-72"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/70 to-transparent p-5 pt-16">
          <h1 className="text-3xl font-black text-white sm:text-4xl">
            {champion.name}
            <span className="ml-3 align-middle text-base font-medium text-slate-300">
              {champion.title}
            </span>
          </h1>
          <p className="mt-1 flex flex-wrap gap-1.5">
            {champion.tags.map((t) => (
              <span key={t} className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-200 ring-1 ring-sky-400/30">
                {t}
              </span>
            ))}
            <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-xs text-slate-300 ring-1 ring-slate-700">
              Resource: {champion.partype || "None"}
            </span>
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-slate-800 lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">Lore</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{champion.lore}</p>

          <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-300">Abilities</h2>
          <div className="mt-3 space-y-3">
            <div className="flex gap-3 rounded-xl bg-slate-800/50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={champion.passive.imageUrl} alt={champion.passive.name} width={44} height={44} className="h-11 w-11 rounded-lg" />
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {champion.passive.name}
                  <span className="ml-2 rounded bg-slate-700/80 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-300">Passive</span>
                </p>
                <p className="mt-0.5 text-sm text-slate-400" dangerouslySetInnerHTML={{ __html: champion.passive.description }} />
              </div>
            </div>
            {champion.spells.map((spell, i) => (
              <div key={spell.id} className="flex gap-3 rounded-xl bg-slate-800/50 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={spell.imageUrl} alt={spell.name} width={44} height={44} className="h-11 w-11 rounded-lg" />
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {spell.name}
                    <span className="ml-2 rounded bg-slate-700/80 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-300">
                      {["Q", "W", "E", "R"][i] ?? ""}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-slate-400" dangerouslySetInnerHTML={{ __html: spell.description }} />
                  <p className="mt-1 text-xs text-slate-500">
                    Cooldown: {spell.cooldownBurn}s · Cost: {spell.costBurn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">Base stats</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              {KEY_STATS.map(({ key, label }) => (
                <div key={key} className="flex justify-between border-b border-white/5 pb-1.5">
                  <dt className="text-slate-400">{label}</dt>
                  <dd className="font-semibold text-slate-100">{champion.stats[key] ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
          {champion.allytips.length > 0 && (
            <div className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-300">Playing as</h2>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-400">
                {champion.allytips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
          {champion.enemytips.length > 0 && (
            <div className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wide text-red-300">Playing against</h2>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-400">
                {champion.enemytips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
          <div className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">Builds for {champion.name}</h2>
            <p className="mt-2 text-sm text-slate-400">
              RiftFix builds come only from archived ranked games. See what the
              Forever archive says so far:
            </p>
            <Link href="/builds" className="mt-2 inline-block text-sm font-semibold text-sky-400 hover:underline">
              Open Builds &amp; Tier List →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
