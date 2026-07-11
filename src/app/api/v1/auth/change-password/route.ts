import { NextRequest, NextResponse } from 'next/server'
import { hash, compare } from 'bcryptjs'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * POST /api/v1/auth/change-password
 *
 * Changes the current user's password. Requires the current password
 * as verification — prevents a stolen session from being used to
 * silently change the password.
 *
 * Body: { currentPassword, newPassword }
 *
 * Safety:
 *   - Auth required (any logged-in user)
 *   - Rate limited (5 attempts/min per IP — blocks brute-force on the
 *     currentPassword field)
 *   - currentPassword must match the stored hash
 *   - newPassword must be 6–200 chars (matches register validation)
 *   - If the user signed in via Google OAuth (no passwordHash), they
 *     can't set a password this way — they'd need to use the password
 *     reset flow (which doesn't exist yet, see REVIEW.md N-5).
 *
 * After a successful change, all of the user's existing sessions
 * remain valid (NextAuth JWT strategy). A future improvement would
 * be to invalidate all sessions by rotating the JWT secret, but that
 * would log out EVERY user, not just this one.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Rate limit — 5 attempts/min per IP. Tighter than the default
    // login limit because the currentPassword field is a brute-force
    // target.
    const ip = getClientIp(req)
    const rl = rateLimit(req, { ...RATE_LIMITS.login, limit: 5, scope: 'change-password' }, `ip:${ip}`)
    if (!rl.ok) return rl.response!

    const body = await req.json().catch(() => ({}))
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      )
    }
    if (newPassword.length > 200) {
      return NextResponse.json(
        { error: 'New password is too long (max 200 characters)' },
        { status: 400 }
      )
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // OAuth users don't have a password — they can't change one.
    if (!dbUser.passwordHash) {
      return NextResponse.json(
        { error: 'Your account uses Google sign-in and has no password set' },
        { status: 400 }
      )
    }

    // Verify the current password
    const isValid = await compare(currentPassword, dbUser.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    // Don't allow same password (bcrypt hash comparison won't catch this
    // because of salt randomization, so we compare against the new plain
    // text — safe because we just verified the user knows their current)
    const isSame = await compare(newPassword, dbUser.passwordHash)
    if (isSame) {
      return NextResponse.json(
        { error: 'New password must be different from your current password' },
        { status: 400 }
      )
    }

    const newHash = await hash(newPassword, 12)
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    })

    return NextResponse.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
