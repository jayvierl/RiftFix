"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TIER_BASE } from "@/lib/ladder";

export interface LpChartPoint {
  capturedAt: string;
  score: number;
  rankLabel: string;
}

const TIER_NAMES = Object.entries(TIER_BASE)
  .filter(([tier]) => tier !== "GRANDMASTER" && tier !== "CHALLENGER")
  .sort((a, b) => a[1] - b[1]);

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: LpChartPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg bg-slate-900 px-3 py-2 text-xs ring-1 ring-slate-700">
      <p className="font-semibold text-slate-100">{p.rankLabel}</p>
      <p className="mt-0.5 text-slate-400">
        {new Date(p.capturedAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}{" "}
        · ladder score {p.score.toLocaleString("en-US")}
      </p>
    </div>
  );
}

/**
 * Ladder-score-over-time chart for one ranked queue. Tier bands are drawn
 * as reference lines at each tier base inside the visible range, so a
 * climb that crosses into a new tier is visible at a glance.
 */
export default function LpChart({ points }: { points: LpChartPoint[] }) {
  const scores = points.map((p) => p.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const pad = Math.max(60, Math.round((max - min) * 0.25));
  const domainMin = Math.max(0, Math.floor((min - pad) / 100) * 100);
  const domainMax = Math.ceil((max + pad) / 100) * 100;
  const tierLines = TIER_NAMES.filter(
    ([, base]) => base > domainMin && base < domainMax
  );

  return (
    <div className="h-56 w-full" aria-label="Ladder score over time">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="lpFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis
            dataKey="capturedAt"
            tickFormatter={fmtDate}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(148,163,184,0.25)" }}
            minTickGap={40}
          />
          <YAxis
            domain={[domainMin, domainMax]}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip content={<ChartTooltip />} />
          {tierLines.map(([tier, base]) => (
            <ReferenceLine
              key={tier}
              y={base}
              stroke="rgba(245,197,66,0.35)"
              strokeDasharray="4 4"
              label={{
                value: tier.charAt(0) + tier.slice(1).toLowerCase(),
                fill: "#f5c542",
                fontSize: 10,
                position: "insideTopLeft",
              }}
            />
          ))}
          <Area
            type="monotone"
            dataKey="score"
            stroke="#22d3ee"
            strokeWidth={2}
            fill="url(#lpFill)"
            dot={{ r: 2.5, fill: "#22d3ee", strokeWidth: 0 }}
            activeDot={{ r: 4, fill: "#e6edf7", stroke: "#22d3ee" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
