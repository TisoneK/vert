import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const playlist = await db.playlist.findUnique({
      where: { id },
      include: {
        channel: {
          select: {
            id: true,
            channelName: true,
            user: { select: { avatarUrl: true } },
          },
        },
        items: {
          orderBy: { position: 'asc' },
          include: {
            video: {
              include: {
                channel: {
                  select: {
                    id: true,
                    channelName: true,
                    user: { select: { avatarUrl: true } },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    // Filter out removed/deleted videos — a playlist may still reference
    // a video whose isRemoved=true. The client shouldn't see those.
    const visibleItems = playlist.items.filter(
      (item) => item.video && !item.video.isRemoved
    )

    return NextResponse.json({
      playlist: {
        ...playlist,
        items: visibleItems,
      },
    })
  } catch (error) {
    console.error('Playlist get error:', error)
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

    const playlist = await db.playlist.findUnique({
      where: { id },
      include: { channel: true },
    })

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    if (playlist.channel.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const updated = await db.playlist.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        isPublic: body.isPublic,
      },
    })

    return NextResponse.json({ playlist: updated })
  } catch (error) {
    console.error('Playlist update error:', error)
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

    const playlist = await db.playlist.findUnique({
      where: { id },
      include: { channel: true },
    })

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    if (playlist.channel.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Cascade delete — PlaylistItem rows are deleted automatically via
    // the schema's onDelete: Cascade on the playlist relation.
    await db.playlist.delete({ where: { id } })

    return NextResponse.json({ message: 'Playlist deleted' })
  } catch (error) {
    console.error('Playlist delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
