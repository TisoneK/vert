import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const video = await db.video.findUnique({ where: { id: videoId } })
    if (!video || video.isRemoved) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where: { videoId, isRemoved: false },
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.comment.count({ where: { videoId, isRemoved: false } }),
    ])

    return NextResponse.json({
      comments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Comments list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Rate limit by user — 20 comments/min supports real conversation, blocks spam.
    const rl = rateLimit(req, RATE_LIMITS.comment, `user:${user.id}`)
    if (!rl.ok) return rl.response!

    const body = await req.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    const video = await db.video.findUnique({ where: { id: videoId } })
    if (!video || video.isRemoved) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const comment = await db.comment.create({
      data: {
        videoId,
        userId: user.id,
        content: content.trim(),
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Comment create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
