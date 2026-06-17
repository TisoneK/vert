import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ channelId: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId } = await params

    // Fetch the channel
    const channel = await db.channel.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        channelName: true,
        subscriberCount: true,
        videoCount: true,
        createdAt: true,
        userId: true,
      },
    })

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Access control: owner OR admin
    const isOwner = channel.userId === user.id
    const isAdmin = user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Run aggregations and queries in parallel
    const [videoAgg, commentAgg, topVideos, recentVideos] = await Promise.all([
      // Sum views/likes/dislikes + count videos
      db.video.aggregate({
        where: { channelId, isRemoved: false },
        _sum: {
          viewCount: true,
          likeCount: true,
          dislikeCount: true,
        },
        _count: { id: true },
      }),
      // Count comments on this channel's videos
      db.comment.aggregate({
        where: {
          video: { channelId, isRemoved: false },
          isRemoved: false,
        },
        _count: { id: true },
      }),
      // Top 5 videos by views
      db.video.findMany({
        where: { channelId, isRemoved: false },
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          viewCount: true,
          likeCount: true,
          createdAt: true,
          _count: { comments: { where: { isRemoved: false } } },
        },
      }),
      // Recent 5 uploads
      db.video.findMany({
        where: { channelId, isRemoved: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          viewCount: true,
          status: true,
          createdAt: true,
        },
      }),
    ])

    const totalViews = videoAgg._sum.viewCount || 0
    const totalLikes = videoAgg._sum.likeCount || 0
    const totalDislikes = videoAgg._sum.dislikeCount || 0
    const totalComments = commentAgg._count.id
    const totalVideos = videoAgg._count.id

    // Engagement rate: (likes + comments) / views * 100, guarded against /0
    const engagementRate = totalViews > 0
      ? Number(((totalLikes + totalComments) / totalViews * 100).toFixed(2))
      : 0

    return NextResponse.json({
      channel: {
        id: channel.id,
        channelName: channel.channelName,
        subscriberCount: channel.subscriberCount,
        videoCount: channel.videoCount,
        createdAt: channel.createdAt.toISOString(),
      },
      totals: {
        totalViews,
        totalLikes,
        totalDislikes,
        totalComments,
        totalVideos,
        engagementRate,
      },
      topVideos: topVideos.map((v) => ({
        id: v.id,
        title: v.title,
        viewCount: v.viewCount,
        likeCount: v.likeCount,
        commentCount: v._count.comments,
        createdAt: v.createdAt.toISOString(),
      })),
      recentVideos: recentVideos.map((v) => ({
        id: v.id,
        title: v.title,
        viewCount: v.viewCount,
        status: v.status,
        createdAt: v.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Account analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
