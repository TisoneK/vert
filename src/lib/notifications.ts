import { db } from '@/lib/db'

/**
 * Helpers for creating in-app notifications.
 *
 * All helpers are fire-and-forget — they swallow errors so a notification
 * failure never breaks the user-facing action that triggered them. The
 * trade-off is that notification delivery is best-effort, not guaranteed.
 *
 * If a notification really must be delivered (e.g. for compliance), wrap
 * the call in a transaction with the triggering action and let errors
 * propagate.
 */

export interface CreateNotificationInput {
  userId: string // recipient
  type: 'subscription' | 'comment' | 'vote' | 'flag' | 'admin' | 'system'
  title: string
  message: string
  actorId?: string | null // who triggered it (null for system)
  relatedVideoId?: string | null
  relatedChannelId?: string | null
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        actorId: input.actorId ?? null,
        relatedVideoId: input.relatedVideoId ?? null,
        relatedChannelId: input.relatedChannelId ?? null,
      },
    })
  } catch (err) {
    // Best-effort — don't fail the parent action
    console.error('Notification create failed:', err)
  }
}

/**
 * Notify all admin users. Used for moderation events (flags, reports).
 * Returns the count of notifications created (for logging if needed).
 */
export async function notifyAllAdmins(input: Omit<CreateNotificationInput, 'userId'>): Promise<number> {
  try {
    const admins = await db.user.findMany({
      where: { role: 'admin', isActive: true },
      select: { id: true },
    })
    if (admins.length === 0) return 0

    await db.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: input.type,
        title: input.title,
        message: input.message,
        actorId: input.actorId ?? null,
        relatedVideoId: input.relatedVideoId ?? null,
        relatedChannelId: input.relatedChannelId ?? null,
      })),
    })
    return admins.length
  } catch (err) {
    console.error('notifyAllAdmins failed:', err)
    return 0
  }
}
