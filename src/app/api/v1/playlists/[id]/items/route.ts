import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
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
    const { videoId } = body

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    // Get max position
    const maxItem = await db.playlistItem.findFirst({
      where: { playlistId: id },
      orderBy: { position: 'desc' },
    })

    const item = await db.playlistItem.create({
      data: {
        playlistId: id,
        videoId,
        position: (maxItem?.position ?? -1) + 1,
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Add playlist item error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
