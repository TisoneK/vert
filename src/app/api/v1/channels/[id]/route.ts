import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parsePagination } from '@/lib/pagination'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { page, limit, skip } = parsePagination(req, { defaultLimit: 12 })

    const channel = await db.channel.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true, email: true },
        },
      },
    })

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const [videos, totalVideos] = await Promise.all([
      db.video.findMany({
        where: { channelId: id, isRemoved: false, status: 'ready' },
        include: {
          channel: {
            select: {
              id: true,
              channelName: true,
              user: {
                select: { avatarUrl: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.video.count({ where: { channelId: id, isRemoved: false, status: 'ready' } }),
    ])

    return NextResponse.json({
      channel,
      videos,
      pagination: {
        page,
        limit,
        total: totalVideos,
        totalPages: Math.ceil(totalVideos / limit),
      },
    })
  } catch (error) {
    console.error('Channel get error:', error)
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

    const channel = await db.channel.findUnique({ where: { id } })
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    if (channel.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const updated = await db.channel.update({
      where: { id },
      data: {
        channelName: body.channelName,
        description: body.description,
        bannerUrl: body.bannerUrl,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Channel update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
