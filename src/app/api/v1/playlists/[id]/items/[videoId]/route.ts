import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const { id, videoId } = await params
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

    await db.playlistItem.deleteMany({
      where: { playlistId: id, videoId },
    })

    return NextResponse.json({ message: 'Item removed from playlist' })
  } catch (error) {
    console.error('Remove playlist item error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
