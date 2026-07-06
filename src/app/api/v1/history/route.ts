import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parsePagination } from '@/lib/pagination'

export async function POST(req: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const videoId = body?.videoId as string | undefined
    const progress = typeof body?.progress === 'number' ? body.progress : 0

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
    }

    // No compound unique constraint on (userId, videoId), so upsert manually:
    // one history row per user/video, refreshed on each watch rather than a
    // new row every time the same video is opened.
    const existing = await db.watchHistory.findFirst({
      where: { userId: user.id, videoId },
      select: { id: true },
    })

    const entry = existing
      ? await db.watchHistory.update({
          where: { id: existing.id },
          data: { progress, watchedAt: new Date() },
        })
      : await db.watchHistory.create({
          data: { userId: user.id, videoId, progress },
        })

    return NextResponse.json({ history: entry })
  } catch (error) {
    console.error('History post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { page, limit, skip } = parsePagination(req, { defaultLimit: 20 })

    const [history, total] = await Promise.all([
      db.watchHistory.findMany({
        where: { userId: user.id },
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
        orderBy: { watchedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.watchHistory.count({ where: { userId: user.id } }),
    ])

    return NextResponse.json({
      history,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('History get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await db.watchHistory.deleteMany({
      where: { userId: user.id },
    })

    return NextResponse.json({ message: 'Watch history cleared' })
  } catch (error) {
    console.error('History clear error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
