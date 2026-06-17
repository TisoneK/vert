import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const categorySlug = searchParams.get('category')

    const where: Record<string, unknown> = {
      isRemoved: false,
      status: 'ready',
    }

    if (categorySlug) {
      const category = await db.category.findUnique({ where: { slug: categorySlug } })
      if (category) {
        where.categories = { some: { categoryId: category.id } }
      }
    }

    // Trending score: combination of viewCount + likeCount * 2, weighted by recency
    // For SQLite, we just sort by a simple score
    const videos = await db.video.findMany({
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
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: [
        { viewCount: 'desc' },
        { likeCount: 'desc' },
      ],
      take: limit,
    })

    const formattedVideos = videos.map((v) => ({
      ...v,
      categories: v.categories.map((vc) => vc.category),
      trendingScore: v.viewCount + v.likeCount * 2,
    }))

    return NextResponse.json({ videos: formattedVideos })
  } catch (error) {
    console.error('Trending error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
