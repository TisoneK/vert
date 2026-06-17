import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'

/**
 * PATCH /api/v1/notifications/[id]/read
 * Marks a single notification as read. Must belong to the current user.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { id } = await params

  // Ensure ownership before mutating
  const existing = await db.notification.findUnique({ where: { id } })
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
  }

  const updated = await db.notification.update({
    where: { id },
    data: { isRead: true },
  })

  return NextResponse.json(updated)
}
