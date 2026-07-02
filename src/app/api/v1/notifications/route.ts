import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'

/**
 * GET /api/v1/notifications
 * Returns the current user's notifications, newest first.
 *
 * Query params:
 *   ?unread=true   -> only unread
 *   ?limit=20      -> default 50, max 100
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const onlyUnread = searchParams.get('unread') === 'true'
  const limitParam = parseInt(searchParams.get('limit') || '50', 10)
  const limit = Math.min(Math.max(limitParam || 50, 1), 100)

  const where = {
    userId: user.id,
    ...(onlyUnread ? { isRead: false } : {}),
  }

  const [items, unreadCount, totalCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    db.notification.count({ where: { userId: user.id, isRead: false } }),
    db.notification.count({ where: { userId: user.id } }),
  ])

  return NextResponse.json({
    notifications: items,
    unreadCount,
    totalCount,
  })
}
