import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parsePagination } from '@/lib/pagination'
import { getCurrentUser } from '@/lib/auth-helpers'

/**
 * GET /api/v1/channels  (no [id] param) — search channels by name.
 * GET /api/v1/channels/[id] — fetch a single channel + its videos.
 *
 * The two are disambiguated by whether [id] is present in the URL.
 * Next.js routes /api/v1/channels (no segment) here only if there's
 * no [id] folder — but we have one. So channel search actually lives
 * at a different path. To keep the API surface clean, channel search
 * is handled in this same file by checking if `id` is 'search'.
 *
 * Actually, Next.js App Router doesn't support that pattern. Channel
 * search lives at /api/v1/channels/search?q=... — but [id] would
 * capture 'search' as an id. So we use a query param check: if the
 * request URL has ?q=, treat it as a search.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Channel search: /api/v1/channels/search?q=...
    // The [id] segment captures 'search' — we detect it and branch.
    if (id === 'search') {
      return handleChannelSearch(req)
    }

    return handleChannelGet(req, id)
  } catch (error) {
    console.error('Channel route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Channel search — /api/v1/channels/search?q=<substring>
 *
 * Returns channels whose channelName contains the query (case-insensitive),
 * with their video + subscriber counts. Used by the search page's
 * 'Channels' tab.
 */
async function handleChannelSearch(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const { limit } = parsePagination(req, { defaultLimit: 20 })

  if (!q) {
    return NextResponse.json({ channels: [] })
  }

  const channels = await db.channel.findMany({
    where: {
      channelName: { contains: q, mode: 'insensitive' },
      isSuspended: false,
    },
    select: {
      id: true,
      channelName: true,
      description: true,
      subscriberCount: true,
      videoCount: true,
      bannerUrl: true,
      createdAt: true,
      user: { select: { avatarUrl: true, username: true } },
    },
    orderBy: { subscriberCount: 'desc' },
    take: limit,
  })

  return NextResponse.json({ channels })
}

/**
 * Single channel fetch — /api/v1/channels/[id]
 *
 * Returns the channel + its videos (paginated).
 */
async function handleChannelGet(req: NextRequest, id: string) {
  const { page, limit, skip } = parsePagination(req, { defaultLimit: 12 })

  const channel = await db.channel.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true },
      },
    },
  })

  if (!channel) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
  }

  const user = await getCurrentUser()
  const isSubscribed = user
    ? Boolean(await db.subscription.findUnique({
        where: {
          subscriberId_channelId: {
            subscriberId: user.id,
            channelId: id,
          },
        },
        select: { subscriberId: true },
      }))
    : false

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
    channel: { ...channel, isSubscribed },
    videos,
    pagination: {
      page,
      limit,
      total: totalVideos,
      totalPages: Math.ceil(totalVideos / limit),
    },
  })
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

    const body = await req.json().catch(() => ({}))

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
