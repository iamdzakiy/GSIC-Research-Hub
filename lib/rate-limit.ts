// ============================================================
// Fixed-window in-memory rate limiter.
// NOTE: per server instance. On multi-instance / serverless deployments swap
// the Map for Upstash Redis (same interface) — see README-PORTAL.md.
// ============================================================
interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();

export interface RateResult { ok: boolean; remaining: number; retryAfterSec: number }

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateResult {
  if (buckets.size > 5_000) buckets.forEach((b, k) => { if (b.resetAt <= now) buckets.delete(k); });
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }
  b.count++;
  const retryAfterSec = Math.ceil((b.resetAt - now) / 1000);
  return { ok: b.count <= limit, remaining: Math.max(0, limit - b.count), retryAfterSec };
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
