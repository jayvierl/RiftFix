"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TrackToggle({
  puuid,
  initialTracked,
}: {
  puuid: string;
  initialTracked: boolean;
}) {
  const router = useRouter();
  const [tracked, setTracked] = useState(initialTracked);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puuid, tracked: !tracked }),
      });
      const data = (await res.json()) as { ok: boolean; tracked?: boolean };
      if (data.ok && typeof data.tracked === "boolean") {
        setTracked(data.tracked);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition disabled:opacity-60 ${
        tracked
          ? "bg-amber-400/15 text-amber-300 ring-amber-300/40 hover:bg-amber-400/25"
          : "bg-slate-800 text-slate-300 ring-slate-600 hover:bg-slate-700"
      }`}
      title="Tracked accounts appear on the RiftFix home screen and anchor your Forever archive."
    >
      {tracked ? "★ Tracked — in your Forever archive" : "☆ Track this account"}
    </button>
  );
}
