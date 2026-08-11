import { NextRequest, NextResponse } from 'next/server'

/**
 * Tiny in-memory rate limiter.
 *
 * Why in-memory and not Redis:
 *   - v1 architecture is single-instance (see ARCHITECTURE.md), so an
 *     in-memory map is sufficient.
 *   - When we migrate to multi-instance deploys, this should move to an
 *     Upstash Redis or Vercel KV backend — same interface, different store.
 *
 * Algorithm: fixed-window counter per (key, windowSeconds) bucket.
 * Good enough for spam prevention; not designed for precise traffic shaping.
 *
 * Limits are intentionally generous — the goal is to stop abuse, not to
 * throttle legitimate use.
 */

interface RateBucket {
  count: number
  resetAt: number // epoch ms
}

// Map of "scope:key" -> bucket
const buckets = new Map<string, RateBucket>()

// Periodically evict expired entries so the map doesn't grow unboundedly.
// (Runs on every call; cheap because Map iterators are O(n) and n is small.)
function evict(now: number) {
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k)
  }
}

export interface RateLimitConfig {
  /** Maximum requests allowed within the window. */
  limit: number
  /** Window size in seconds. */
  windowSeconds: number
  /** Scope prefix — usually the route name (e.g. "upload", "vote", "login"). */
  scope: string
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
  /** HTTP 429 response ready to return, or null if request is allowed. */
  response: NextResponse | null
}

/**
 * Apply rate limiting to a request. The key is usually `ip:<addr>` or
 * `user:<userId>`, depending on whether the route is auth-required.
 *
 * Usage:
 *   const rl = rateLimit(req, { limit: 10, windowSeconds: 60, scope: 'upload' }, `user:${user.id}`)
 *   if (!rl.ok) return rl.response
 */
export function rateLimit(
  req: NextRequest,
  config: RateLimitConfig,
  key: string
): RateLimitResult {
  const now = Date.now()
  evict(now)

  const bucketKey = `${config.scope}:${key}`
  const bucket = buckets.get(bucketKey)

  let count: number
  let resetAt: number

  if (!bucket || bucket.resetAt <= now) {
    count = 1
    resetAt = now + config.windowSeconds * 1000
    buckets.set(bucketKey, { count, resetAt })
  } else {
    bucket.count += 1
    count = bucket.count
    resetAt = bucket.resetAt
  }

  const ok = count <= config.limit
  const remaining = Math.max(0, config.limit - count)

  return {
    ok,
    remaining,
    resetAt,
    response: ok
      ? null
      : NextResponse.json(
          {
            error: 'Too many requests',
            retryAfter: Math.ceil((resetAt - now) / 1000),
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((resetAt - now) / 1000)),
              'X-RateLimit-Limit': String(config.limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.floor(resetAt / 1000)),
            },
          }
        ),
  }
}

/**
 * Get a stable client identifier from the request.
 *
 * Uses the `x-forwarded-for` header (set by Vercel and most reverse proxies),
 * falling back to `x-real-ip`, then to a fixed string for local dev where
 * neither header is present.
 */
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  const xri = req.headers.get('x-real-ip')
  if (xri) return xri.trim()
  return 'unknown'
}

/**
 * Common rate-limit configs — exported so routes can use a consistent
 * policy without copy-pasting numbers.
 */
export const RATE_LIMITS = {
  /** Auth: 10 login attempts per minute per IP — blocks brute force. */
  login: { limit: 10, windowSeconds: 60, scope: 'login' },
  /** Auth: 5 signup attempts per minute per IP — blocks account spam. */
  signup: { limit: 5, windowSeconds: 60, scope: 'signup' },
  /** Uploads: 10 per minute per user — generous for power users, blocks spam. */
  upload: { limit: 10, windowSeconds: 60, scope: 'upload' },
  /** Comments: 20 per minute per user — supports real conversation. */
  comment: { limit: 20, windowSeconds: 60, scope: 'comment' },
  /** Votes: 60 per minute per user — plenty for binge-scrolling. */
  vote: { limit: 60, windowSeconds: 60, scope: 'vote' },
  /** Generic read: 120 per minute per IP — well above any human rate. */
  read: { limit: 120, windowSeconds: 60, scope: 'read' },
  /** Contact form: 5 messages per minute per IP — blocks form spam. */
  contact: { limit: 5, windowSeconds: 60, scope: 'contact' },
} as const
