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
      },
    })

    if (!video || video.isRemoved) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Increment view count
    await db.video.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json({ ...video, viewCount: video.viewCount + 1 })
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
