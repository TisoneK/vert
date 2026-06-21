import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

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

    // Rate limit by user — 60 votes/min is well above any human rate.
    const rl = rateLimit(req, RATE_LIMITS.vote, `user:${user.id}`)
    if (!rl.ok) return rl.response!

    const body = await req.json()
    const { voteType } = body

    if (!voteType || !['like', 'dislike'].includes(voteType)) {
      return NextResponse.json({ error: 'Vote type must be "like" or "dislike"' }, { status: 400 })
    }

    const video = await db.video.findUnique({ where: { id: videoId } })
    if (!video || video.isRemoved) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Check existing vote
    const existing = await db.vote.findUnique({
      where: { userId_videoId: { userId: user.id, videoId } },
    })

    if (existing) {
      if (existing.voteType === voteType) {
        // Remove vote (toggle off)
        await db.vote.delete({ where: { id: existing.id } })
        await db.video.update({
          where: { id: videoId },
          data: {
            likeCount: voteType === 'like' ? { decrement: 1 } : undefined,
            dislikeCount: voteType === 'dislike' ? { decrement: 1 } : undefined,
          },
        })
        return NextResponse.json({ action: 'removed', voteType: null })
      } else {
        // Change vote type
        await db.vote.update({
          where: { id: existing.id },
          data: { voteType },
        })
        await db.video.update({
          where: { id: videoId },
          data: {
            likeCount: voteType === 'like' ? { increment: 1 } : { decrement: 1 },
            dislikeCount: voteType === 'dislike' ? { increment: 1 } : { decrement: 1 },
          },
        })
        return NextResponse.json({ action: 'changed', voteType })
      }
    }

    // Create new vote
    await db.vote.create({
      data: { userId: user.id, videoId, voteType },
    })
    await db.video.update({
      where: { id: videoId },
      data: {
        likeCount: voteType === 'like' ? { increment: 1 } : undefined,
        dislikeCount: voteType === 'dislike' ? { increment: 1 } : undefined,
      },
    })

    return NextResponse.json({ action: 'created', voteType }, { status: 201 })
  } catch (error) {
    console.error('Vote error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    const existing = await db.vote.findUnique({
      where: { userId_videoId: { userId: user.id, videoId } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'No vote found' }, { status: 404 })
    }

    await db.vote.delete({ where: { id: existing.id } })
    await db.video.update({
      where: { id: videoId },
      data: {
        likeCount: existing.voteType === 'like' ? { decrement: 1 } : undefined,
        dislikeCount: existing.voteType === 'dislike' ? { decrement: 1 } : undefined,
      },
    })

    return NextResponse.json({ message: 'Vote removed' })
  } catch (error) {
    console.error('Vote delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
