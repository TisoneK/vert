import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    // Clamp limit to a safe range. Was parseInt() with no validation —
    // a request like ?limit=10000 would try to load 10000 videos with
    // 4 joins each, easily OOMing the serverless function.
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10)
    const limit =
      Number.isFinite(rawLimit) && rawLimit >= 1
        ? Math.min(Math.floor(rawLimit), 100)
        : 20
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

    // Trending score: viewCount + likeCount * 2. Computed client-side in
    // the response so the API consumer can see the score — the actual
    // ORDER BY uses viewCount desc, likeCount desc (a stable composite
    // sort that the DB can index).
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
        tags: {
          select: {
            tag: {
              select: { id: true, name: true, label: true },
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
      tags: v.tags.map((vt) => vt.tag),
      trendingScore: v.viewCount + v.likeCount * 2,
    }))

    return NextResponse.json({ videos: formattedVideos })
  } catch (error) {
    console.error('Trending error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
