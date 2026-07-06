import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parsePagination } from '@/lib/pagination'

export async function GET(req: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const channel = await db.channel.findUnique({
      where: { userId: user.id },
    })

    if (!channel) {
      return NextResponse.json({ error: 'No channel found' }, { status: 404 })
    }

    const { page, limit, skip } = parsePagination(req, { defaultLimit: 20 })

    const [videos, total] = await Promise.all([
      db.video.findMany({
        where: { channelId: channel.id },
        include: {
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.video.count({ where: { channelId: channel.id } }),
    ])

    const formatted = videos.map((v) => ({
      id: v.id,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      durationSeconds: v.durationSeconds,
      viewCount: v.viewCount,
      likeCount: v.likeCount,
      dislikeCount: v.dislikeCount,
      status: v.status,
      format: v.format,
      createdAt: v.createdAt,
      commentCount: v._count.comments,
    }))

    return NextResponse.json({
      videos: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Creator videos error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
