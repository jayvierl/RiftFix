"use client";

import { ActivityCalendar, type Activity } from "react-activity-calendar";

const WEEKS = 26;

function levelFor(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

function toDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * GitHub-style games-per-day calendar for the last ~26 weeks, built from
 * the player's Forever archive. Days are bucketed in UTC (the archive
 * stores epoch timestamps; RiftFix doesn't know the visitor's timezone,
 * so it doesn't pretend to).
 */
export default function SeasonHeatmap({
  gamesByDay,
}: {
  /** Sparse "yyyy-MM-dd" (UTC) -> games played that day. */
  gamesByDay: Record<string, number>;
}) {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (WEEKS * 7 - 1));

  const data: Activity[] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = toDayKey(d);
    const count = gamesByDay[key] ?? 0;
    data.push({ date: key, count, level: levelFor(count) });
  }

  return (
    <div className="scroll-thin overflow-x-auto pb-1">
      <ActivityCalendar
        data={data}
        colorScheme="dark"
        theme={{
          dark: ["#141d30", "#155e75", "#0e7490", "#22d3ee", "#8b5cf6"],
        }}
        blockSize={11}
        blockMargin={3}
        blockRadius={2}
        fontSize={11}
        showTotalCount={false}
        showWeekdayLabels={["mon", "wed", "fri"]}
        labels={{
          legend: { less: "Less", more: "More" },
        }}
      />
    </div>
  );
}
