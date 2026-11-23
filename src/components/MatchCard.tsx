"use client";

import { useState } from "react";
import type { ArchivedMatch, ArchivedParticipant } from "@/lib/types";
import { queueLabel } from "@/lib/analysis";
import { duration, num, timeAgo } from "@/lib/format";

function ItemIcons({
  items,
  trinket,
  version,
  size = 26,
}: {
  items: number[];
  trinket?: number;
  version: string;
  size?: number;
}) {
  const all = [...items, ...(trinket ? [trinket] : [])];
  return (
    <div className="flex gap-0.5">
      {all.map((item, i) =>
        item > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item}.png`}
            alt=""
            width={size}
            height={size}
            className="rounded-md ring-1 ring-black/40"
            loading="lazy"
          />
        ) : (
          <span
            key={i}
            style={{ width: size, height: size }}
            className="rounded-md bg-slate-800/80 ring-1 ring-slate-700/50"
          />
        )
      )}
    </div>
  );
}

function TeamTable({
  match,
  teamId,
  focusPuuid,
  version,
  champIcons,
}: {
  match: ArchivedMatch;
  teamId: number;
  focusPuuid: string;
  version: string;
  champIcons: Record<number, string>;
}) {
  const players = match.participants.filter((p) => p.teamId === teamId);
  const maxDamage = Math.max(...players.map((p) => p.damageToChampions), 1);
  return (
    <div className="min-w-[520px] flex-1">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="pb-1 font-medium">Player</th>
            <th className="pb-1 font-medium">KDA</th>
            <th className="pb-1 font-medium">Damage</th>
            <th className="pb-1 font-medium">CS</th>
            <th className="pb-1 font-medium">Items</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p: ArchivedParticipant) => (
            <tr
              key={p.puuid}
              className={
                p.puuid === focusPuuid
                  ? "bg-sky-400/10 font-semibold text-sky-200"
                  : "text-slate-300"
              }
            >
              <td className="py-1 pr-2">
                <span className="flex items-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={champIcons[p.championId] ?? ""}
                    alt={p.championName}
                    width={22}
                    height={22}
                    className="rounded"
                    loading="lazy"
                  />
                  <span className="max-w-[110px] truncate">
                    {p.gameName}
                    <span className="block text-[10px] font-normal text-slate-500">
                      {p.championName}
                      {p.position ? ` · ${p.position}` : ""}
                    </span>
                  </span>
                </span>
              </td>
              <td className="py-1 pr-2 whitespace-nowrap">
                {p.kills}/{p.deaths}/{p.assists}
              </td>
              <td className="py-1 pr-2">
                <span className="block whitespace-nowrap">{num(p.damageToChampions)}</span>
                <span className="mt-0.5 block h-1 w-16 rounded bg-slate-800">
                  <span
                    className="block h-1 rounded bg-orange-400/80"
                    style={{ width: `${(p.damageToChampions / maxDamage) * 100}%` }}
                  />
                </span>
              </td>
              <td className="py-1 pr-2">{p.cs}</td>
              <td className="py-1">
                <ItemIcons items={p.items} trinket={p.trinket} version={version} size={20} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MatchCard({
  match,
  puuid,
  version,
  champIcons,
}: {
  match: ArchivedMatch;
  puuid: string;
  version: string;
  champIcons: Record<number, string>;
}) {
  const [open, setOpen] = useState(false);
  const me = match.participants.find((p) => p.puuid === puuid);
  if (!me) return null;
  const kda =
    me.deaths === 0 ? "Perfect" : ((me.kills + me.assists) / me.deaths).toFixed(2);

  return (
    <div
      className={`rounded-xl ring-1 ${
        me.win
          ? "bg-sky-950/50 ring-sky-500/25"
          : "bg-red-950/40 ring-red-500/25"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <span
          className={`w-14 text-sm font-bold ${me.win ? "text-sky-300" : "text-red-300"}`}
        >
          {me.win ? "Victory" : "Defeat"}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={champIcons[me.championId] ?? ""}
          alt={me.championName}
          width={40}
          height={40}
          className="rounded-lg"
        />
        <span className="min-w-[120px]">
          <span className="block text-sm font-semibold text-slate-100">
            {me.kills} / <span className="text-red-300">{me.deaths}</span> / {me.assists}
          </span>
          <span className="block text-[11px] text-slate-400">
            {kda} KDA · {me.cs} CS · {num(me.visionScore)} vision
          </span>
        </span>
        <span className="hidden md:block">
          <ItemIcons items={me.items} trinket={me.trinket} version={version} />
        </span>
        <span className="ml-auto text-right text-[11px] text-slate-400">
          <span className="block font-medium text-slate-300">{queueLabel(match.queueId)}</span>
          {duration(match.gameDurationSec / 60)} · {timeAgo(match.gameStartTimestamp)}
          <span className="block text-slate-500">{open ? "Hide scoreboard ▲" : "Scoreboard ▼"}</span>
        </span>
      </button>
      {open && (
        <div className="scroll-thin flex gap-4 overflow-x-auto border-t border-white/5 px-3 py-3">
          <TeamTable match={match} teamId={100} focusPuuid={puuid} version={version} champIcons={champIcons} />
          <TeamTable match={match} teamId={200} focusPuuid={puuid} version={version} champIcons={champIcons} />
        </div>
      )}
    </div>
  );
}
