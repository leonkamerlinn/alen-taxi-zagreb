/**
 * Best-effort in-memory fixed-window rate limiter.
 * Per warm instance only — state resets on Cloud Run cold start, which is an
 * acceptable trade-off for abuse-blunting (not a hard security boundary).
 */
const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}
