import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const video = await db.video.findUnique({
      where: { id },
      include: {
        categories: { select: { categoryId: true } },
      },
    })

    if (!video || video.isRemoved) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const categoryIds = video.categories.map((c) => c.categoryId)

    // Find related videos: same categories or same channel, exclude current video
    const related = await db.video.findMany({
      where: {
        id: { not: id },
        isRemoved: false,
        status: 'ready',
        OR: [
          { channelId: video.channelId },
          ...(categoryIds.length > 0
            ? [{ categories: { some: { categoryId: { in: categoryIds } } } }]
            : []),
        ],
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
      orderBy: { viewCount: 'desc' },
      take: limit,
    })

    const formattedVideos = related.map((v) => ({
      ...v,
      categories: v.categories.map((vc) => vc.category),
    }))

    return NextResponse.json({ videos: formattedVideos })
  } catch (error) {
    console.error('Related videos error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
