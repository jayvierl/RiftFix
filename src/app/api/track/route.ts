import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Retired: tracked accounts are per-visitor now and live in the visitor's
 * own browser (localStorage, see src/lib/tracked-local.ts). This stub keeps
 * the old global endpoint from silently coming back and tells any stale
 * client why it is gone.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Server-side tracking was retired. Tracked players are now saved in your own browser from the player page.",
    },
    { status: 410 }
  );
}
