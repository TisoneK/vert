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

    const body = await req.json().catch(() => ({}))
    const videoId = body?.videoId as string | undefined
    const progress = typeof body?.progress === 'number' ? body.progress : 0

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
    }

    // The (userId, videoId) unique constraint on WatchHistory lets us
    // upsert atomically — no more findFirst + create/update race window
    // where two concurrent requests could both create a row.
    const entry = await db.watchHistory.upsert({
      where: { userId_videoId: { userId: user.id, videoId } },
      update: { progress, watchedAt: new Date() },
      create: { userId: user.id, videoId, progress },
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
