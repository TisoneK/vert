import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { requireAdmin } = await import('@/lib/auth-helpers')
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 30 days ago cutoff for growth stats
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Run all aggregations in parallel for performance
    const [
      totalUsers,
      totalVideos,
      totalChannels,
      totalViewsAgg,
      flagsPending,
      flagsReviewed,
      flagsActioned,
      flagsDismissed,
      newUsers30,
      newVideos30,
      newChannels30,
      topVideos,
      topChannels,
    ] = await Promise.all([
      db.user.count(),
      db.video.count({ where: { isRemoved: false } }),
      db.channel.count(),
      db.video.aggregate({ _sum: { viewCount: true } }),
      db.flag.count({ where: { status: 'pending' } }),
      db.flag.count({ where: { status: 'reviewed' } }),
      db.flag.count({ where: { status: 'actioned' } }),
      db.flag.count({ where: { status: 'dismissed' } }),
      db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.video.count({ where: { isRemoved: false, createdAt: { gte: thirtyDaysAgo } } }),
      db.channel.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.video.findMany({
        where: { isRemoved: false },
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          viewCount: true,
          likeCount: true,
          channel: { select: { id: true, channelName: true } },
        },
      }),
      db.channel.findMany({
        orderBy: { subscriberCount: 'desc' },
        take: 5,
        select: {
          id: true,
          channelName: true,
          subscriberCount: true,
          videoCount: true,
        },
      }),
    ])

    return NextResponse.json({
      overview: {
        totalUsers,
        totalVideos,
        totalChannels,
        totalViews: totalViewsAgg._sum.viewCount || 0,
        flagsPending,
      },
      growth: {
        newUsers: newUsers30,
        newVideos: newVideos30,
        newChannels: newChannels30,
        since: thirtyDaysAgo.toISOString(),
      },
      topVideos: topVideos.map((v) => ({
        id: v.id,
        title: v.title,
        viewCount: v.viewCount,
        likeCount: v.likeCount,
        channelId: v.channel.id,
        channelName: v.channel.channelName,
      })),
      topChannels: topChannels.map((c) => ({
        id: c.id,
        channelName: c.channelName,
        subscriberCount: c.subscriberCount,
        videoCount: c.videoCount,
      })),
      flagBreakdown: {
        pending: flagsPending,
        reviewed: flagsReviewed,
        actioned: flagsActioned,
        dismissed: flagsDismissed,
      },
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
