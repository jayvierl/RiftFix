"use client";

import { useState } from "react";
import Image from "next/image";
import { rankEmblemUrl } from "@/lib/art";

/**
 * The actual League rank emblem art (CommunityDragon ranked crest,
 * single-file composite) beside the rank text. Progressive enhancement:
 * if the tier has no emblem (unranked, EMERALD — the crest set predates
 * it) or the CDN fails, nothing renders and the text stands on its own.
 */
export default function RankEmblem({
  tier,
  size = 56,
}: {
  tier: string | null | undefined;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const url = rankEmblemUrl(tier);
  if (!url || failed) return null;
  return (
    <Image
      src={url}
      alt=""
      width={Math.round(size * 0.875)}
      height={size}
      unoptimized
      className="shrink-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
      onError={() => setFailed(true)}
    />
  );
}
