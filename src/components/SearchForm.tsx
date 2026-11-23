"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLATFORM_LIST } from "@/lib/regions";
import { profilePath } from "@/lib/format";

export default function SearchForm({
  defaultPlatform = "na1",
  autoFocus = false,
}: {
  defaultPlatform?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [riotId, setRiotId] = useState("");
  const [platform, setPlatform] = useState(defaultPlatform);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const raw = riotId.trim();
    const hash = raw.lastIndexOf("#");
    if (hash <= 0 || hash === raw.length - 1) {
      setError("Enter your full Riot ID, including the tag — e.g. Jay Lewis#NA1.");
      return;
    }
    const gameName = raw.slice(0, hash).trim();
    const tagLine = raw.slice(hash + 1).trim();
    setBusy(true);
    try {
      const q = new URLSearchParams({ platform, gameName, tagLine });
      const res = await fetch(`/api/search?${q.toString()}`);
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        player?: { gameName: string; tagLine: string; platform: string };
      };
      if (!data.ok || !data.player) {
        setError(data.error ?? "Player not found. Check the Riot ID and region.");
        setBusy(false);
        return;
      }
      router.push(
        profilePath(data.player.platform, data.player.gameName, data.player.tagLine)
      );
    } catch {
      setError("Search failed — network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center rounded-xl bg-slate-900/80 ring-1 ring-slate-700/80 focus-within:ring-sky-400/60">
          <span className="pl-4 pr-1 text-slate-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          </span>
          <input
            value={riotId}
            onChange={(e) => setRiotId(e.target.value)}
            placeholder="Riot ID — e.g. Jay Lewis#NA1"
            autoFocus={autoFocus}
            className="w-full bg-transparent px-2 py-3.5 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none"
            aria-label="Riot ID"
          />
        </div>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="rounded-xl bg-slate-900/80 px-3 py-3.5 text-sm text-slate-200 ring-1 ring-slate-700/80 focus:outline-none focus:ring-sky-400/60"
          aria-label="Region"
        >
          {PLATFORM_LIST.map((p) => (
            <option key={p.platform} value={p.platform}>
              {p.label} ({p.platform.toUpperCase()})
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-sky-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Searching…" : "Search"}
        </button>
      </div>
      {error && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-400/20">
          {error}
        </p>
      )}
    </form>
  );
}
