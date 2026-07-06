import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parsePagination } from '@/lib/pagination'

/**
 * GET /api/v1/tags/[slug]/videos
 *
 * Returns videos that have the given tag attached, sorted by views/recency.
 *
 * The [slug] parameter is the tag's normalized name (lowercase, no spaces).
 * We look up by `name` since that's the unique business key.
 *
 * Query params (same shape as /api/v1/videos):
 *   ?page=1
 *   ?limit=12
 *   ?sort=latest | trending | popular | views | date
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const tag = await db.tag.findUnique({ where: { name: slug.toLowerCase() } })

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const { page, limit, skip } = parsePagination(req, { defaultLimit: 12 })
    const sort = searchParams.get('sort') || 'latest'

    const orderBy: Record<string, string> =
      sort === 'trending' ? { viewCount: 'desc' }
      : sort === 'popular' ? { likeCount: 'desc' }
      : sort === 'views' ? { viewCount: 'desc' }
      : sort === 'date' ? { createdAt: 'desc' }
      : { createdAt: 'desc' }

    const where = {
      isRemoved: false,
      status: 'ready',
      tags: { some: { tagId: tag.id } },
    }

    const [videos, total] = await Promise.all([
      db.video.findMany({
        where,
        include: {
          channel: {
            select: {
              id: true,
              channelName: true,
              user: { select: { avatarUrl: true } },
            },
          },
          categories: {
            select: {
              category: { select: { id: true, name: true, slug: true } },
            },
          },
          tags: {
            select: {
              tag: { select: { id: true, name: true, label: true } },
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
      tag: {
        id: tag.id,
        name: tag.name,
        label: tag.label,
        usageCount: tag.usageCount,
      },
      videos: formattedVideos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Tag videos list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
