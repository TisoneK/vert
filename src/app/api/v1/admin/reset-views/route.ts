import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-helpers'

/**
 * Resets every video's viewCount to 0 — a clean slate now that views are
 * properly deduped (WatchHistory for logged-in accounts, a per-video
 * cookie for anonymous viewers, see /api/v1/videos/[id]/route.ts). From
 * this point on the counter only grows on genuine new/unique views.
 *
 * Admin-only. POST to apply — no dry run, this one's a simple flat reset
 * rather than a recalculation, so there's nothing to preview.
 */
export async function POST() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const result = await db.video.updateMany({
    data: { viewCount: 0 },
  })

  return NextResponse.json({
    reset: true,
    videosUpdated: result.count,
  })
}
