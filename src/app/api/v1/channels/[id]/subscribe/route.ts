import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: channelId } = await params
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const channel = await db.channel.findUnique({ where: { id: channelId } })
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    if (channel.userId === user.id) {
      return NextResponse.json({ error: 'Cannot subscribe to your own channel' }, { status: 400 })
    }

    const existing = await db.subscription.findUnique({
      where: {
        subscriberId_channelId: { subscriberId: user.id, channelId },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 409 })
    }

    await db.subscription.create({
      data: { subscriberId: user.id, channelId },
    })

    await db.channel.update({
      where: { id: channelId },
      data: { subscriberCount: { increment: 1 } },
    })

    // Notify the channel owner that they have a new subscriber.
    // Best-effort — failure here doesn't fail the subscribe action.
    await createNotification({
      userId: channel.userId,
      type: 'subscription',
      title: 'New subscriber',
      message: `${user.username} subscribed to your channel "${channel.channelName}"`,
      actorId: user.id,
      relatedChannelId: channelId,
    })

    return NextResponse.json({ message: 'Subscribed' }, { status: 201 })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: channelId } = await params
    const { getCurrentUser } = await import('@/lib/auth-helpers')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const existing = await db.subscription.findUnique({
      where: {
        subscriberId_channelId: { subscriberId: user.id, channelId },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not subscribed' }, { status: 404 })
    }

    await db.subscription.delete({ where: { id: existing.id } })

    await db.channel.update({
      where: { id: channelId },
      data: { subscriberCount: { decrement: 1 } },
    })

    return NextResponse.json({ message: 'Unsubscribed' })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
