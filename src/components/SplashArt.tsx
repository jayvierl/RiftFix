"use client";

import { useState } from "react";
import Image from "next/image";
import { cdragonSplashUrl, ddragonSplashUrl } from "@/lib/art";

/**
 * Champion splash hero with a fallback chain: CommunityDragon's centered
 * splash first (higher fidelity, current client art), then Data Dragon's
 * splash if the community CDN misses, then nothing (the gradient header
 * underneath still looks intentional). `unoptimized`: the browser loads
 * the CDN file directly, so a community-CDN quirk can never take the
 * image optimizer down with it (same choice in RankEmblem).
 */
export default function SplashArt({
  championId,
  name,
  className,
}: {
  /** Data Dragon string id, e.g. "Renata". */
  championId: string;
  name: string;
  className?: string;
}) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  if (stage === 2) return null;
  const src =
    stage === 0 ? cdragonSplashUrl(championId) : ddragonSplashUrl(championId);
  return (
    <Image
      src={src}
      alt={`${name} splash art`}
      fill
      priority
      unoptimized
      sizes="(max-width: 1152px) 100vw, 1152px"
      className={className}
      onError={() => setStage((s) => (s === 0 ? 1 : 2))}
    />
  );
}
