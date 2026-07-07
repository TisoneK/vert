import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const sessionUser = await getCurrentUser()
    if (!sessionUser) {
      return NextResponse.json({ user: null })
    }

    // Always look up the user's current role + channel from the DB.
    // Don't trust the JWT — it may be stale if the user's role changed
    // after the token was issued.
    const dbUser = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        channel: { select: { id: true } },
      },
    })

    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ user: null })
    }

    // Heartbeat: update lastSeenAt so the admin dashboard can show who's
    // online right now. Fire-and-forget (not awaited) so it doesn't slow
    // down the session check. Throttled to once per 60s per user via a
    // conditional update — only writes if the last update was >60s ago,
    // to avoid hammering the DB on every single page navigation.
    db.user.updateMany({
      where: { id: dbUser.id, OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: new Date(Date.now() - 60_000) } }] },
      data: { lastSeenAt: new Date() },
    }).catch(() => { /* silent — presence is best-effort */ })

    return NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username,
        role: dbUser.role,
        channelId: dbUser.channel?.id || null,
      },
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null })
  }
}
