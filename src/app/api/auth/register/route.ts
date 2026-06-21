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

    const body = await req.json()
    const { email, username, password } = body

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Email, username, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    const passwordHash = await hash(password, 12)

    const user = await db.user.create({
      data: {
        email,
        username,
        passwordHash,
        role: 'member',
        channel: {
          create: {
            channelName: username,
            description: `Welcome to ${username}'s channel!`,
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
