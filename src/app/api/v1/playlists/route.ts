import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { channelId, title, description, isPublic } = body

    if (!channelId || !title) {
      return NextResponse.json(
        { error: 'Channel ID and title are required' },
        { status: 400 }
      )
    }

    const channel = await db.channel.findUnique({ where: { id: channelId } })
    if (!channel || channel.userId !== user.id) {
      return NextResponse.json({ error: 'Channel not found or unauthorized' }, { status: 403 })
    }

    const playlist = await db.playlist.create({
      data: {
        channelId,
        title,
        description: description || null,
        isPublic: isPublic !== undefined ? isPublic : true,
      },
    })

    return NextResponse.json({ playlist }, { status: 201 })
  } catch (error) {
    console.error('Playlist create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
