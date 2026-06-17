import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ user: null })
    }

    const { db } = await import('@/lib/db')
    const channel = await db.channel.findUnique({
      where: { userId: user.id },
      select: { id: true, channelName: true },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        channelId: channel?.id || null,
      },
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null })
  }
}
