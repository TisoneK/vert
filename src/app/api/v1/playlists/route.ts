import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/v1/playlists
 *
 * Returns the current user's playlists, newest first.
 *
 * Each playlist includes a `videoCount` and a `thumbnailUrl` (the
 * thumbnail of the first video in the playlist, or null if empty) so
 * the UI can render a preview card without a second fetch.
 */
export async function GET(req: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const channel = await db.channel.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })

    if (!channel) {
      return NextResponse.json({ playlists: [] })
    }

    const playlists = await db.playlist.findMany({
      where: { channelId: channel.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { items: true } },
        items: {
          orderBy: { position: 'asc' },
          take: 1,
          select: {
            video: {
              select: { thumbnailUrl: true },
            },
          },
        },
      },
    })

    // Flatten the shape — _count.items → videoCount, first item's video
    // thumbnail → thumbnailUrl.
    const formatted = playlists.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      isPublic: p.isPublic,
      createdAt: p.createdAt,
      videoCount: p._count.items,
      thumbnailUrl: p.items[0]?.video.thumbnailUrl ?? null,
    }))

    return NextResponse.json({ playlists: formatted })
  } catch (error) {
    console.error('Playlists list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { channelId, title, description, isPublic } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }
    if (title.trim().length > 100) {
      return NextResponse.json(
        { error: 'Title is too long (max 100 characters)' },
        { status: 400 }
      )
    }

    // Look up the user's channel automatically if channelId isn't provided.
    // The old code required channelId in the body, but the client always
    // has user.channelId — making the client pass it was redundant.
    let channelOwner = channelId
    if (!channelOwner) {
      const userChannel = await db.channel.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      channelOwner = userChannel?.id
    }

    if (!channelOwner) {
      return NextResponse.json({ error: 'No channel found for user' }, { status: 404 })
    }

    const channel = await db.channel.findUnique({ where: { id: channelOwner } })
    if (!channel || channel.userId !== user.id) {
      return NextResponse.json({ error: 'Channel not found or unauthorized' }, { status: 403 })
    }

    const trimmedDescription =
      typeof description === 'string' ? description.trim().slice(0, 1000) : null

    const playlist = await db.playlist.create({
      data: {
        channelId: channelOwner,
        title: title.trim(),
        description: trimmedDescription,
        isPublic: isPublic !== undefined ? !!isPublic : true,
      },
    })

    return NextResponse.json({ playlist }, { status: 201 })
  } catch (error) {
    console.error('Playlist create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
