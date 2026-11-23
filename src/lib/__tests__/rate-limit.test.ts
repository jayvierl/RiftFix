import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "../rate-limit";

// Unique key per test: the limiter keeps module-level buckets.
let seq = 0;
const key = () => `test-${++seq}`;

describe("rateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to the max, then blocks", () => {
    const k = key();
    expect(rateLimit(k, 3, 60_000)).toBe(true);
    expect(rateLimit(k, 3, 60_000)).toBe(true);
    expect(rateLimit(k, 3, 60_000)).toBe(true);
    expect(rateLimit(k, 3, 60_000)).toBe(false);
    expect(rateLimit(k, 3, 60_000)).toBe(false);
  });

  it("tracks buckets independently per key", () => {
    const a = key();
    const b = key();
    expect(rateLimit(a, 1, 60_000)).toBe(true);
    expect(rateLimit(a, 1, 60_000)).toBe(false);
    expect(rateLimit(b, 1, 60_000)).toBe(true);
  });

  it("allows again once hits fall out of the window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-23T12:00:00Z"));
    const k = key();
    expect(rateLimit(k, 2, 60_000)).toBe(true);
    expect(rateLimit(k, 2, 60_000)).toBe(true);
    expect(rateLimit(k, 2, 60_000)).toBe(false);
    vi.setSystemTime(new Date("2026-11-23T12:01:01Z"));
    expect(rateLimit(k, 2, 60_000)).toBe(true);
  });

  it("does not count blocked attempts as new hits", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-23T12:00:00Z"));
    const k = key();
    expect(rateLimit(k, 1, 60_000)).toBe(true);
    vi.setSystemTime(new Date("2026-11-23T12:00:30Z"));
    expect(rateLimit(k, 1, 60_000)).toBe(false);
    // 61s after the one real hit (not after the blocked attempt) it frees up.
    vi.setSystemTime(new Date("2026-11-23T12:01:01Z"));
    expect(rateLimit(k, 1, 60_000)).toBe(true);
  });
});
