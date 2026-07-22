import { NextResponse } from 'next/server'

/**
 * Environment guard for destructive / administrative "ops" endpoints
 * (/api/seed, /api/cleanup-demo) that must not sit openly reachable on the
 * production URL.
 *
 * These endpoints are already key-gated (SEED_KEY), but a data-wiping
 * endpoint that is only one leaked or guessed key away from running against
 * the production database is a standing risk. cleanup-demo in particular
 * does several unfiltered `deleteMany({})` calls (all tags, all video-tag
 * and video-category links), so an accidental prod hit is not "demo only".
 *
 * Policy:
 *   - Non-production (local dev + Vercel preview): always allowed. Seeding
 *     and wiping throwaway databases is the whole point in those envs.
 *   - Vercel production: BLOCKED — returns 404 so the route doesn't even
 *     advertise its existence — UNLESS an operator explicitly opts in by
 *     setting ENABLE_OPS_ENDPOINTS=true. That escape hatch preserves the
 *     documented one-time production seed: set the flag, hit /api/seed once,
 *     then remove the flag again.
 *
 * "Production" is keyed off Vercel's VERCEL_ENV ('production' | 'preview' |
 * 'development') rather than NODE_ENV, because NODE_ENV is 'production' for
 * BOTH preview and production deployments on Vercel — VERCEL_ENV is the only
 * signal that distinguishes the live environment from previews.
 *
 * Returns a NextResponse (404) when the endpoint is disabled, or null when
 * the caller may proceed. Call this before the key check so production never
 * reveals anything about the endpoint (existence or key-matching timing).
 */
export function opsEndpointDisabledResponse(): NextResponse | null {
  const isVercelProduction = process.env.VERCEL_ENV === 'production'
  const optedIn = process.env.ENABLE_OPS_ENDPOINTS === 'true'

  if (isVercelProduction && !optedIn) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return null
}
