import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { db } from '@/lib/db'
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP — blocks account-creation spam.
    // 5 signups per minute per IP is well above any legitimate use.
    const ip = getClientIp(req)
    const rl = rateLimit(req, RATE_LIMITS.signup, `ip:${ip}`)
    if (!rl.ok) return rl.response!

    const body = await req.json().catch(() => ({}))
    const { email, username, password } = body

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Email, username, and password are required' },
        { status: 400 }
      )
    }

    // Reject non-string passwords before they reach .length / bcrypt —
    // a JSON number here would skip both length checks and make hash()
    // throw, turning a client error into a 500.
    if (typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password must be a string' },
        { status: 400 }
      )
    }

    // Normalize email — lowercase + trim — before any further validation.
    const normalizedEmail = email.toString().trim().toLowerCase()
    const normalizedUsername = username.toString().trim()

    // Email format check — the DB unique constraint is on raw text, so an
    // invalid string like "asdf" would otherwise be accepted as a valid
    // email and lock the user out of password-reset flows forever.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail) || normalizedEmail.length > 320) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Username rules: 3–20 chars, alphanumeric + underscore only.
    // Mirrors the username normalization used by Google OAuth sign-in
    // (lowercase + strip non-alphanumeric) so creds logins and OAuth
    // logins produce the same shape of username.
    if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
      return NextResponse.json(
        { error: 'Username must be 3–20 characters' },
        { status: 400 }
      )
    }
    if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }
    if (password.length > 200) {
      return NextResponse.json(
        { error: 'Password is too long (max 200 characters)' },
        { status: 400 }
      )
    }

    // Check if user already exists.
    // Username match is case-insensitive — otherwise "John" and "john" could
    // register as separate accounts, then login (also case-insensitive) would
    // be ambiguous. The DB unique constraint is case-sensitive (plain VARCHAR),
    // so this application-level check is what actually prevents duplicates.
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: { equals: normalizedUsername, mode: 'insensitive' } },
        ],
      },
    })

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    const passwordHash = await hash(password, 12)

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        passwordHash,
        role: 'member',
        channel: {
          create: {
            channelName: normalizedUsername,
            description: `Welcome to ${normalizedUsername}'s channel!`,
          },
        },
      },
      include: { channel: true },
    })

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        channelId: user.channel?.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
