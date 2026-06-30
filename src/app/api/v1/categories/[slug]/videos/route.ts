import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sort = searchParams.get('sort') || 'latest'

    const category = await db.category.findUnique({
      where: { slug },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const skip = (page - 1) * limit

    const orderBy: Record<string, string> = sort === 'trending'
      ? { viewCount: 'desc' }
      : sort === 'popular'
        ? { likeCount: 'desc' }
        : { createdAt: 'desc' }

    const [videos, total] = await Promise.all([
      db.video.findMany({
        where: {
          isRemoved: false,
          status: 'ready',
          categories: {
            some: { categoryId: category.id },
          },
        },
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
        orderBy,
        skip,
        take: limit,
      }),
      db.video.count({
        where: {
          isRemoved: false,
          status: 'ready',
          categories: {
            some: { categoryId: category.id },
          },
        },
      }),
    ])

    const formattedVideos = videos.map((v) => ({
      ...v,
      categories: v.categories.map((vc) => vc.category),
    }))

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
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
    console.error('Category videos error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
