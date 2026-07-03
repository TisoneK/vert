import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifyAllAdmins } from '@/lib/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { reason } = body

    const validReasons = ['spam', 'nudity', 'hate_speech', 'violence', 'misinformation', 'other']
    if (!reason || !validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Valid reason is required' }, { status: 400 })
    }

    const video = await db.video.findUnique({ where: { id: videoId } })
    if (!video || video.isRemoved) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Check for duplicate flag
    const existingFlag = await db.flag.findFirst({
      where: { videoId, reportedBy: user.id, status: 'pending' },
    })

    if (existingFlag) {
      return NextResponse.json({ error: 'You have already flagged this video' }, { status: 409 })
    }

    const flag = await db.flag.create({
      data: {
        videoId,
        reportedBy: user.id,
        reason,
        status: 'pending',
      },
    })

    // Notify all admins — flagged content needs moderation review.
    // Best-effort; failure doesn't fail the flag action itself.
    await notifyAllAdmins({
      type: 'flag',
      title: 'Video flagged for review',
      message: `${user.username} flagged "${video.title}" — reason: ${reason}`,
      actorId: user.id,
      relatedVideoId: videoId,
    })

    return NextResponse.json(flag, { status: 201 })
  } catch (error) {
    console.error('Flag create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
