/**
 * Tiny in-memory per-key rate limiter for API routes.
 *
 * Best-effort by design: state lives in this process, so on serverless it
 * is per-instance — it blunts casual hammering of a single instance, it is
 * not a distributed quota. The hard protection for the Riot key budget is
 * the shared request gate in riot.ts; this layer just keeps one client
 * from monopolizing an instance.
 */
import "server-only";
import type { NextRequest } from "next/server";

const buckets = new Map<string, number[]>();

/** Returns true when the request is allowed, false when over the limit. */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => t > now - windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

/** Client IP from the proxy header Vercel sets; first entry is the client. */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}
