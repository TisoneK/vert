import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const channel = await db.channel.findUnique({
      where: { userId: user.id },
    })

    if (!channel) {
      return NextResponse.json({ error: 'No channel found' }, { status: 404 })
    }

    const videos = await db.video.findMany({
      where: { channelId: channel.id, isRemoved: false },
      select: {
        viewCount: true,
        likeCount: true,
        dislikeCount: true,
      },
    })

    const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0)
    const totalLikes = videos.reduce((sum, v) => sum + v.likeCount, 0)
    const totalDislikes = videos.reduce((sum, v) => sum + v.dislikeCount, 0)

    return NextResponse.json({
      stats: {
        totalVideos: videos.length,
        totalViews,
        totalLikes,
        totalDislikes,
        subscriberCount: channel.subscriberCount,
        channelName: channel.channelName,
      },
    })
  } catch (error) {
    console.error('Creator stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
