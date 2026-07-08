import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parsePagination } from '@/lib/pagination'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const { page, limit, skip } = parsePagination(req, { defaultLimit: 12 })
    const channelId = searchParams.get('channel_id')
    const search = searchParams.get('search')
    const categorySlug = searchParams.get('category')
    const format = searchParams.get('format')
    const sort = searchParams.get('sort') || 'latest'
    // New filters
    const channelSearch = searchParams.get('channel')  // match channel name
    const dateFilter = searchParams.get('date')  // today | week | month | year
    const minDuration = searchParams.get('min_duration')  // seconds
    const maxDuration = searchParams.get('max_duration')  // seconds

    const where: Record<string, unknown> = {
      isRemoved: false,
      status: 'ready',
    }

    if (channelId) {
      where.channelId = channelId
    }

    if (search) {
      // Search video title + description, OR channel name (case-insensitive).
      // The channel name match uses a nested relation filter — Prisma
      // translates this to a JOIN with a LIKE clause.
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { channel: { channelName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (channelSearch) {
      // Separate channel-name-only filter (when ?channel= is set without ?search=)
      where.channel = { channelName: { contains: channelSearch, mode: 'insensitive' } }
    }

    if (format) {
      where.format = format
    }

    // Date range filter
    if (dateFilter) {
      const now = new Date()
      let cutoff: Date | null = null
      switch (dateFilter) {
        case 'today':
          cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case 'week':
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
      }
      if (cutoff) where.createdAt = { gte: cutoff }
    }

    // Duration range filter
    if (minDuration || maxDuration) {
      const durationFilter: Record<string, number> = {}
      if (minDuration) {
        const min = parseInt(minDuration, 10)
        if (Number.isFinite(min) && min >= 0) durationFilter.gte = min
      }
      if (maxDuration) {
        const max = parseInt(maxDuration, 10)
        if (Number.isFinite(max) && max >= 0) durationFilter.lte = max
      }
      if (Object.keys(durationFilter).length > 0) {
        where.durationSeconds = durationFilter
      }
    }

    if (categorySlug) {
      const category = await db.category.findUnique({ where: { slug: categorySlug } })
      if (category) {
        where.categories = { some: { categoryId: category.id } }
      }
    }

    const orderBy: Record<string, string> = sort === 'trending'
      ? { viewCount: 'desc' }
      : sort === 'popular'
        ? { likeCount: 'desc' }
        : sort === 'views'
          ? { viewCount: 'desc' }
          : sort === 'date'
            ? { createdAt: 'desc' }
            : { createdAt: 'desc' }

    const [videos, total] = await Promise.all([
      db.video.findMany({
        where,
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
          categories: {
            select: {
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          tags: {
            select: {
              tag: {
                select: { id: true, name: true, label: true },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.video.count({ where }),
    ])

    const formattedVideos = videos.map((v) => ({
      ...v,
      categories: v.categories.map((vc) => vc.category),
      tags: v.tags.map((vt) => vt.tag),
    }))

    return NextResponse.json({
      videos: formattedVideos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Videos list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { channelId, title, description, videoUrl, thumbnailUrl, durationSeconds, aspectRatio, format, categoryIds, tags: tagNames } = body

    if (!channelId || !title || !videoUrl) {
      return NextResponse.json(
        { error: 'Channel ID, title, and video URL are required' },
        { status: 400 }
      )
    }

    // Title rules: 1–100 chars after trim. Matches YouTube's title limit
    // and keeps the listing UI from breaking on huge strings.
    const trimmedTitle = typeof title === 'string' ? title.trim() : ''
    if (trimmedTitle.length === 0) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
    }
    if (trimmedTitle.length > 100) {
      return NextResponse.json(
        { error: 'Title is too long (max 100 characters)' },
        { status: 400 }
      )
    }

    // Description: max 5000 chars (matches YouTube). Null/empty is fine.
    const trimmedDescription =
      typeof description === 'string' ? description.trim().slice(0, 5000) : null

    // videoUrl + thumbnailUrl must be https — prevents storing arbitrary
    // javascript:/data: URLs that could be exploited elsewhere.
    try {
      const u = new URL(videoUrl)
      if (u.protocol !== 'https:') {
        return NextResponse.json({ error: 'videoUrl must be https' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'videoUrl must be a valid URL' }, { status: 400 })
    }
    if (thumbnailUrl) {
      try {
        const u = new URL(thumbnailUrl)
        if (u.protocol !== 'https:') {
          return NextResponse.json({ error: 'thumbnailUrl must be https' }, { status: 400 })
        }
      } catch {
        return NextResponse.json({ error: 'thumbnailUrl must be a valid URL' }, { status: 400 })
      }
    }

    // Verify channel ownership
    const channel = await db.channel.findUnique({
      where: { id: channelId },
    })

    if (!channel || channel.userId !== user.id) {
      return NextResponse.json({ error: 'Channel not found or unauthorized' }, { status: 403 })
    }

    if (channel.isSuspended) {
      return NextResponse.json({ error: 'Channel is suspended' }, { status: 403 })
    }

    // Normalize incoming tags: lowercase, strip non-alphanumeric, dedupe, cap at 8
    const normalizedTags = Array.isArray(tagNames)
      ? Array.from(new Set(
          tagNames
            .map((t: unknown) => typeof t === 'string' ? t : '')
            .map((t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, ''))
            .filter((t: string) => t.length > 0 && t.length <= 32)
        )).slice(0, 8) as string[]
      : []

    // Upsert tag records (create if missing) and capture their ids
    let tagLinks: Array<{ tagId: string }> = []
    if (normalizedTags.length > 0) {
      const tagRecords = await Promise.all(
        normalizedTags.map((name) =>
          db.tag.upsert({
            where: { name },
            update: {},
            create: { name, label: `#${name}` },
          })
        )
      )
      tagLinks = tagRecords.map((t) => ({ tagId: t.id }))
    }

    // Validate format — VideoCard and the player use this to pick the aspect
    // ratio class. An invalid value silently falls through to portrait, which
    // is misleading (a landscape video rendered in a 9:16 box). Default to
    // portrait only if omitted; reject anything else.
    const VALID_FORMATS = ['portrait', 'landscape', 'square'] as const
    const normalizedFormat =
      format === undefined ? 'portrait'
      : VALID_FORMATS.includes(format) ? format
      : null
    if (normalizedFormat === null) {
      return NextResponse.json(
        { error: `format must be one of: ${VALID_FORMATS.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate durationSeconds — must be a non-negative finite number if
    // provided. Use `?? null` (not `|| null`) so a legitimate 0 is preserved.
    let normalizedDuration: number | null = null
    if (durationSeconds !== undefined && durationSeconds !== null) {
      const d = Number(durationSeconds)
      if (!Number.isFinite(d) || d < 0) {
        return NextResponse.json(
          { error: 'durationSeconds must be a non-negative number' },
          { status: 400 }
        )
      }
      normalizedDuration = d
    }

    const video = await db.video.create({
      data: {
        channelId,
        title: trimmedTitle,
        description: trimmedDescription,
        videoUrl,
        thumbnailUrl: thumbnailUrl || null,
        durationSeconds: normalizedDuration,
        aspectRatio: aspectRatio || '9:16',
        format: normalizedFormat,
        status: 'ready',
        categories: categoryIds?.length
          ? {
              create: categoryIds.map((catId: string) => ({
                categoryId: catId,
              })),
            }
          : undefined,
        tags: tagLinks.length
          ? { create: tagLinks }
          : undefined,
      },
    })

    // Bump usageCount for any newly-attached tags
    if (tagLinks.length > 0) {
      await db.tag.updateMany({
        where: { id: { in: tagLinks.map((l) => l.tagId) } },
        data: { usageCount: { increment: 1 } },
      })
    }

    // Update channel video count
    await db.channel.update({
      where: { id: channelId },
      data: { videoCount: { increment: 1 } },
    })

    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    console.error('Video create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
