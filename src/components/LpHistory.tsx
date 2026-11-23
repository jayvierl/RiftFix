"use client";

import dynamic from "next/dynamic";
import type { LpChartPoint } from "./LpChart";

/**
 * Client wrapper for the LP climb chart. Recharts is heavy, so the chart
 * itself is code-split with next/dynamic — ssr:false is only legal inside
 * a client component like this one, never in the server page.
 */
const LpChart = dynamic(() => import("./LpChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 items-center justify-center rounded-xl bg-slate-800/40 text-xs text-slate-500">
      Loading climb chart…
    </div>
  ),
});

export default function LpHistory({ points }: { points: LpChartPoint[] }) {
  return <LpChart points={points} />;
}
