import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const video = await db.video.findUnique({
      where: { id },
      include: {
        channel: {
          select: {
            id: true,
            channelName: true,
            subscriberCount: true,
            isSuspended: true,
            user: {
              select: { avatarUrl: true, username: true },
            },
          },
        },
        votes: {
          select: { userId: true, voteType: true },
        },
        categories: {
          select: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        tags: {
          select: {
            tag: {
              select: { id: true, name: true, label: true },
            },
          },
        },
      },
    })

    if (!video || video.isRemoved) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Views were previously counted on every single request to this route —
    // every page load, refresh, or re-open by the same account added +1, so
    // a creator watching their own video 5 times showed 5 views. Count at
    // most once per logged-in account, using WatchHistory (one row per
    // user/video, see /api/v1/history) as the "have they already been
    // counted" check. Anonymous (logged-out) viewers can't be deduped
    // without a session cookie, so they still count every load for now —
    // a real fix there would need a per-visitor cookie/session id.
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()

    let viewCountDelta = 0
    if (user) {
      const alreadyWatched = await db.watchHistory.findFirst({
        where: { userId: user.id, videoId: id },
        select: { id: true },
      })
      if (!alreadyWatched) {
        viewCountDelta = 1
        // Record the watch now so a concurrent/duplicate request (e.g. a
        // fast refresh before the client's separate history POST resolves)
        // sees this row and doesn't double-count. The client's own POST to
        // /api/v1/history will just update this same row afterwards.
        await db.watchHistory.create({
          data: { userId: user.id, videoId: id, progress: 0 },
        })
      }
    } else {
      viewCountDelta = 1
    }

    if (viewCountDelta > 0) {
      await db.video.update({
        where: { id },
        data: { viewCount: { increment: viewCountDelta } },
      })
    }

    // Flatten join tables for the response (same shape as /api/v1/videos)
    const formatted = {
      ...video,
      categories: video.categories.map((vc) => vc.category),
      tags: video.tags.map((vt) => vt.tag),
    }

    return NextResponse.json({ ...formatted, viewCount: video.viewCount + viewCountDelta })
  } catch (error) {
    console.error('Video get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const video = await db.video.findUnique({
      where: { id },
      include: { channel: true },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    if (video.channel.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const updated = await db.video.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        thumbnailUrl: body.thumbnailUrl,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Video update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const video = await db.video.findUnique({
      where: { id },
      include: { channel: true },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    if (video.channel.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Soft delete
    await db.video.update({
      where: { id },
      data: { isRemoved: true },
    })

    // Update channel video count
    await db.channel.update({
      where: { id: video.channelId },
      data: { videoCount: { decrement: 1 } },
    })

    return NextResponse.json({ message: 'Video removed' })
  } catch (error) {
    console.error('Video delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
