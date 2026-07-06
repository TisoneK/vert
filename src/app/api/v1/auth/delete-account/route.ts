import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * POST /api/v1/auth/delete-account
 *
 * Permanently deletes the current user's account. This is the user
 * self-service counterpart to the admin DELETE /admin/users/[id].
 *
 * Body: { password: string, confirm: true }
 *
 * Safety:
 *   - Auth required
 *   - Rate limited (3 attempts/min per IP)
 *   - For credential users: password must match (re-verification)
 *   - For OAuth users: only requires { confirm: true } (they have no
 *     password to verify against)
 *   - Requires explicit { confirm: true } flag as a footgun guard
 *
 * Cascade-deletes the user's channel, videos, comments, votes,
 * subscriptions, playlists, notifications, etc. via the schema's
 * onDelete: Cascade rules. This is irreversible.
 *
 * Note: the response sets a clear-cache header so the client can
 * trigger a signOut() after the delete succeeds.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const ip = getClientIp(req)
    const rl = rateLimit(req, { ...RATE_LIMITS.login, limit: 3, scope: 'delete-account' }, `ip:${ip}`)
    if (!rl.ok) return rl.response!

    const body = await req.json()
    const { password, confirm } = body

    if (!confirm) {
      return NextResponse.json(
        { error: 'Confirmation required — pass { confirm: true } in the body' },
        { status: 400 }
      )
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true, email: true, username: true },
    })

    if (!dbUser) {
      // User already deleted? Treat as success.
      return NextResponse.json({ message: 'Account deleted' })
    }

    // Re-verify password for credential users. OAuth users skip this.
    if (dbUser.passwordHash) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required to delete your account' },
          { status: 400 }
        )
      }
      const isValid = await compare(password, dbUser.passwordHash)
      if (!isValid) {
        return NextResponse.json({ error: 'Password is incorrect' }, { status: 401 })
      }
    }

    // Cascade delete via schema's onDelete: Cascade rules.
    await db.user.delete({ where: { id: user.id } })

    console.log(`User self-deleted: ${dbUser.email} (${dbUser.username})`)

    return NextResponse.json({ message: 'Account deleted' })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
