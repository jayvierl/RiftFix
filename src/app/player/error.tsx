"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PlayerError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const tryAgain = retry ?? reset;

  return (
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="text-2xl font-black text-slate-50">
        This profile hit a snag
      </h1>
      <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm leading-relaxed text-red-200 ring-1 ring-red-400/25">
        Something went wrong while loading this player profile. Your Forever
        archive is untouched — this is a display problem, not a data problem.
        Wait a few seconds and try again; if it keeps happening, the Riot API
        may be having a moment.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        {tryAgain && (
          <button
            onClick={() => tryAgain()}
            className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-400"
          >
            Try again
          </button>
        )}
        <Link href="/" className="text-sm text-sky-400 hover:underline">
          ← Back to RiftFix home
        </Link>
      </div>
    </div>
  );
}
