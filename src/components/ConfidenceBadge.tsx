import type { Confidence } from "@/lib/analysis";

const STYLES: Record<Confidence, string> = {
  Solid: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Promising: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  "Too early": "bg-amber-500/15 text-amber-300 ring-amber-400/30",
};

export default function ConfidenceBadge({
  confidence,
  samples,
}: {
  confidence: Confidence;
  samples?: number;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${STYLES[confidence]}`}
      title="Confidence is based purely on how many archived games back this number."
    >
      {confidence}
      {samples !== undefined && <span className="opacity-75">· n={samples}</span>}
    </span>
  );
}
