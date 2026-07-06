import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-helpers'

/**
 * Recalculates video.viewCount from real data instead of the old
 * increment-on-every-request counter (see /api/v1/videos/[id]/route.ts).
 *
 * IMPORTANT LIMITATION — read before running the POST (apply) variant:
 * The only reliable per-viewer signal we have is WatchHistory, which is
 * one row per (userId, videoId) for LOGGED-IN accounts. There is no
 * historical record of anonymous/logged-out views — those were never
 * deduped or stored anywhere, so they can't be recovered. That means:
 *
 *   newViewCount = distinct WatchHistory rows for that video
 *
 * This will almost certainly be LOWER than the current inflated
 * viewCount, likely much lower — it's a floor based on real accounts,
 * not a "corrected" estimate of true total views. Anonymous views will
 * start counting again from zero and grow correctly going forward
 * (they're now deduped via a per-video browser cookie).
 *
 * GET  — dry run. Shows old vs. new count per video, changes nothing.
 * POST — applies the recalculation.
 */

async function computeChanges() {
  const videos = await db.video.findMany({
    select: { id: true, title: true, viewCount: true },
  })

  const results = await Promise.all(
    videos.map(async (video) => {
      const newViewCount = await db.watchHistory.count({
        where: { videoId: video.id },
      })
      return {
        videoId: video.id,
        title: video.title,
        oldViewCount: video.viewCount,
        newViewCount,
      }
    })
  )

  return results
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const changes = await computeChanges()
  return NextResponse.json({
    dryRun: true,
    message: 'No changes applied. POST to this same endpoint to apply.',
    changes,
  })
}

export async function POST() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const changes = await computeChanges()

  await Promise.all(
    changes.map((c) =>
      db.video.update({
        where: { id: c.videoId },
        data: { viewCount: c.newViewCount },
      })
    )
  )

  return NextResponse.json({
    applied: true,
    changes,
  })
}
