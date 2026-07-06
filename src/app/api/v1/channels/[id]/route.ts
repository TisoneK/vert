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

    // Validate channel name if provided.
    const trimmedName =
      typeof body.channelName === 'string' ? body.channelName.trim() : undefined
    if (trimmedName !== undefined) {
      if (trimmedName.length === 0) {
        return NextResponse.json({ error: 'Channel name cannot be empty' }, { status: 400 })
      }
      if (trimmedName.length > 50) {
        return NextResponse.json(
          { error: 'Channel name is too long (max 50 characters)' },
          { status: 400 }
        )
      }
    }
    // Description: max 1000 chars.
    const trimmedDescription =
      typeof body.description === 'string'
        ? body.description.trim().slice(0, 1000)
        : body.description
    // Banner URL: must be https if provided.
    if (body.bannerUrl) {
      try {
        const u = new URL(body.bannerUrl)
        if (u.protocol !== 'https:') {
          return NextResponse.json({ error: 'bannerUrl must be https' }, { status: 400 })
        }
      } catch {
        return NextResponse.json({ error: 'bannerUrl must be a valid URL' }, { status: 400 })
      }
    }

    const updated = await db.channel.update({
      where: { id },
      data: {
        channelName: trimmedName ?? body.channelName,
        description: trimmedDescription,
        bannerUrl: body.bannerUrl,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Channel update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
