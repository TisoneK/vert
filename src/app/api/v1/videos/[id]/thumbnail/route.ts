import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * POST /api/v1/videos/[id]/thumbnail
 *
 * Backfill a thumbnail for a video that doesn't have one yet.
 *
 * Why this exists: the upload flow used to not auto-generate thumbnails,
 * so videos uploaded before that fix have `thumbnailUrl = null`. When a
 * logged-in viewer watches such a video, the client captures a frame via
 * <canvas> and POSTs the PNG here. We upload it to Vercel Blob and patch
 * the video record.
 *
 * Rules:
 *   - Auth required (any logged-in user — this is crowdsourced backfill)
 *   - Only works if the video currently has NO thumbnail (don't overwrite)
 *   - Rate limited per user
 *   - Body: { thumbnailUrl: string } — a Vercel Blob URL the client
 *     already uploaded via /api/v1/upload + @vercel/blob/client put()
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const rl = rateLimit(req, RATE_LIMITS.upload, `user:${user.id}`)
    if (!rl.ok) return rl.response!

    const video = await db.video.findUnique({
      where: { id },
      select: { id: true, thumbnailUrl: true, isRemoved: true },
    })

    if (!video || video.isRemoved) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Don't overwrite an existing thumbnail — this endpoint is backfill-only.
    if (video.thumbnailUrl) {
      return NextResponse.json(
        { error: 'Video already has a thumbnail', thumbnailUrl: video.thumbnailUrl },
        { status: 409 }
      )
    }

    const body = await req.json()
    const { thumbnailUrl } = body as { thumbnailUrl?: string }

    if (!thumbnailUrl || typeof thumbnailUrl !== 'string') {
      return NextResponse.json({ error: 'thumbnailUrl is required' }, { status: 400 })
    }

    // Basic sanity check — must look like a Vercel Blob URL or an https URL.
    // This prevents storing arbitrary javascript: or data: URLs.
    try {
      const u = new URL(thumbnailUrl)
      if (u.protocol !== 'https:') {
        return NextResponse.json({ error: 'thumbnailUrl must be https' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'thumbnailUrl must be a valid URL' }, { status: 400 })
    }

    const updated = await db.video.update({
      where: { id },
      data: { thumbnailUrl },
      select: { id: true, thumbnailUrl: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Thumbnail backfill error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
