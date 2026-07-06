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

    const { page, limit, skip } = parsePagination(req, { defaultLimit: 20 })

    const [saved, total] = await Promise.all([
      db.savedVideo.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.savedVideo.count({ where: { userId: user.id } }),
    ])

    return NextResponse.json({
      saved,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Saved videos get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
