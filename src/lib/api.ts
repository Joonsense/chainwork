import { type NextRequest } from "next/server";

/**
 * Helpers for the public JSON API (`/api/jobs`) — wide-open CORS so any
 * agent can read it, plus a lightweight per-IP rate limiter.
 */

/** Wide-open CORS — the job feed is meant to be read by any origin. */
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

/** Best-effort client IP from proxy headers (Vercel sets `x-forwarded-for`). */
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/* ── in-memory fixed-window rate limiter ─────────────────────────
   600 requests / minute / IP. This is per-instance state — good
   enough for this phase; swap for Upstash if global consistency
   across serverless instances is ever required. */
const WINDOW_MS = 60_000;
const LIMIT = 600;
const MAX_BUCKETS = 20_000;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

/** Records one hit for `ip` and reports whether it stayed under the limit. */
export function rateLimit(ip: string): RateResult {
  const now = Date.now();

  // Opportunistic prune — keeps the map from growing unbounded.
  if (buckets.size > MAX_BUCKETS) {
    for (const [key, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(key);
    }
  }

  let bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, bucket);
  }
  bucket.count += 1;

  return {
    ok: bucket.count <= LIMIT,
    limit: LIMIT,
    remaining: Math.max(0, LIMIT - bucket.count),
    resetAt: bucket.resetAt,
  };
}
