"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ChampionSummary } from "@/lib/ddragon";

const ALL_TAGS = ["Fighter", "Mage", "Assassin", "Tank", "Support", "Marksman"];

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
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search champions…"
          className="w-full rounded-xl bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 ring-1 ring-slate-700/80 focus:outline-none focus:ring-sky-400/60 sm:max-w-xs"
          aria-label="Search champions"
        />
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
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/champions/${c.id}`}
            className="group rounded-xl bg-slate-900/60 p-2 ring-1 ring-slate-800 transition hover:bg-slate-800/80 hover:ring-sky-400/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.iconUrl}
              alt={c.name}
              loading="lazy"
              className="aspect-square w-full rounded-lg object-cover"
            />
            <p className="mt-1.5 truncate text-center text-xs font-semibold text-slate-200 group-hover:text-sky-300">
              {c.name}
            </p>
            <p className="truncate text-center text-[10px] text-slate-500">
              {c.tags.join(" · ")}
            </p>
          </Link>
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
