"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import type { ChampionSummary } from "@/lib/ddragon";
import { ddragonLoadingUrl } from "@/lib/art";

const ALL_TAGS = ["Fighter", "Mage", "Assassin", "Tank", "Support", "Marksman"];

const MotionLink = motion.create(Link);

export default function ChampionGrid({
  champions,
}: {
  champions: ChampionSummary[];
}) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return champions.filter((c) => {
      if (tag && !c.tags.includes(tag)) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [champions, query, tag]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search champions…"
            className="w-full rounded-xl bg-slate-900/80 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 ring-1 ring-slate-700/80 focus:outline-none focus:ring-sky-400/60"
            aria-label="Search champions"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTag(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
              tag === null
                ? "bg-sky-500 text-white ring-sky-400"
                : "bg-slate-800/80 text-slate-300 ring-slate-700 hover:bg-slate-700"
            }`}
          >
            All
          </button>
          {ALL_TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setTag(tag === t ? null : t)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                tag === t
                  ? "bg-sky-500 text-white ring-sky-400"
                  : "bg-slate-800/80 text-slate-300 ring-slate-700 hover:bg-slate-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {filtered.length} of {champions.length} champions
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {filtered.map((c, i) => (
          <MotionLink
            key={c.id}
            href={`/champions/${c.id}`}
            className="group overflow-hidden rounded-xl bg-slate-900/60 ring-1 ring-slate-800 transition hover:bg-slate-800/80 hover:ring-sky-400/40"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.015, 0.3) }}
          >
            <div className="relative overflow-hidden">
              <Image
                src={ddragonLoadingUrl(c.id)}
                alt={c.name}
                width={308}
                height={560}
                className="aspect-[3/4] w-full object-cover object-top transition-transform duration-300 group-hover:scale-110"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <p className="mt-1.5 truncate px-1 text-center text-xs font-semibold text-slate-200 group-hover:text-sky-300">
              {c.name}
            </p>
            <p className="truncate px-1 pb-2 text-center text-[10px] text-slate-500">
              {c.tags.join(" · ")}
            </p>
          </MotionLink>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-8 text-center text-sm text-slate-400">
          No champions match that search.
        </p>
      )}
    </div>
  );
}
