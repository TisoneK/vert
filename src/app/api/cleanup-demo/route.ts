import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { timingSafeEqual } from 'crypto'

/**
 * GET /api/cleanup-demo?key=<SEED_KEY>
 *
 * Removes all demo seed data from the database while keeping:
 * - Real user accounts (anyone not in the demo email list)
 * - Real uploaded videos
 * - Categories (useful empty taxonomy)
 *
 * Deletes:
 * - Demo users: admin@vert.com, user1-5@vert.com
 * - All videos with the BigBuckBunny placeholder URL
 * - All comments, votes, subscriptions, playlists from demo users
 * - All demo notifications
 * - All tags (they were only attached to demo videos)
 */

const DEMO_EMAILS = [
  'admin@vert.com',
  'user1@vert.com',
  'user2@vert.com',
  'user3@vert.com',
  'user4@vert.com',
  'user5@vert.com',
]

const PLACEHOLDER_URL = 'commondatastorage.googleapis.com'

function keyMatches(candidate: string | null, expected: string | undefined): boolean {
  if (!candidate || !expected) return false
  if (candidate.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')

  if (!keyMatches(key, process.env.SEED_KEY)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Shared lazy singleton from src/lib/db.ts — carries the serverless pool
  // params and must not be $disconnect()ed here.
  const prisma = db

  try {
    const deleted: Record<string, number> = {}

    // 1. Delete demo videos (placeholder URL) — cascade deletes comments, votes, etc.
    const demoVideos = await prisma.video.deleteMany({
      where: { videoUrl: { contains: PLACEHOLDER_URL } },
    })
    deleted.demoVideos = demoVideos.count

    // 2. Delete all VideoTag links
    await prisma.videoTag.deleteMany({})

    // 3. Delete all tags
    const tags = await prisma.tag.deleteMany({})
    deleted.tags = tags.count

    // 4. Delete demo notifications
    const notifs = await prisma.notification.deleteMany({
      where: { user: { email: { in: DEMO_EMAILS } } },
    })
    deleted.notifications = notifs.count

    // 5. Delete demo users (cascade deletes channels, subscriptions, etc.)
    const demoUsers = await prisma.user.deleteMany({
      where: { email: { in: DEMO_EMAILS } },
    })
    deleted.demoUsers = demoUsers.count

    // 6. Delete any orphaned channels (userId no longer in users table)
    const allUserIds = (await prisma.user.findMany({ select: { id: true } })).map(u => u.id)
    const channels = await prisma.channel.deleteMany({
      where: { userId: { notIn: allUserIds } },
    })
    deleted.orphanedChannels = channels.count

    // 7. Clean up remaining votes/comments from demo users
    const votes = await prisma.vote.deleteMany({
      where: { user: { email: { in: DEMO_EMAILS } } },
    })
    deleted.orphanedVotes = votes.count

    const comments = await prisma.comment.deleteMany({
      where: { user: { email: { in: DEMO_EMAILS } } },
    })
    deleted.orphanedComments = comments.count

    // 8. Clean up video-category links for deleted videos
    await prisma.videoCategory.deleteMany({})

    // 9. Check what remains
    const remaining = {
      users: await prisma.user.count(),
      channels: await prisma.channel.count(),
      videos: await prisma.video.count(),
      categories: await prisma.category.count(),
      tags: await prisma.tag.count(),
      notifications: await prisma.notification.count(),
    }

    return NextResponse.json({
      message: 'Demo data cleaned up.',
      deleted,
      remaining,
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
