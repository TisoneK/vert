import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'

/**
 * POST /api/v1/notifications/read-all
 * Marks every unread notification for the current user as read.
 * Returns the number of records updated.
 */
export async function POST(_req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const result = await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  })

  return NextResponse.json({ updated: result.count })
}
