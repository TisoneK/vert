import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const channelId = searchParams.get('channel_id')
    const search = searchParams.get('search')
    const categorySlug = searchParams.get('category')
    const format = searchParams.get('format')
    const sort = searchParams.get('sort') || 'latest'

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      isRemoved: false,
      status: 'ready',
    }

    if (channelId) {
      where.channelId = channelId
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    if (format) {
      where.format = format
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
    const { channelId, title, description, videoUrl, thumbnailUrl, durationSeconds, aspectRatio, format, categoryIds } = body

    if (!channelId || !title || !videoUrl) {
      return NextResponse.json(
        { error: 'Channel ID, title, and video URL are required' },
        { status: 400 }
      )
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

    const video = await db.video.create({
      data: {
        channelId,
        title,
        description: description || null,
        videoUrl,
        thumbnailUrl: thumbnailUrl || null,
        durationSeconds: durationSeconds || null,
        aspectRatio: aspectRatio || '9:16',
        format: format || 'portrait',
        status: 'ready',
        categories: categoryIds?.length
          ? {
              create: categoryIds.map((catId: string) => ({
                categoryId: catId,
              })),
            }
          : undefined,
      },
    })

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
