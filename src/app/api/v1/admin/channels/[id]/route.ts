import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { requireAdmin } = await import('@/lib/auth-helpers')
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { suspend, reason } = body

    const channel = await db.channel.findUnique({ where: { id } })
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const updated = await db.channel.update({
      where: { id },
      data: { isSuspended: suspend !== false },
    })

    await db.adminAction.create({
      data: {
        adminId: admin.id,
        targetType: 'channel',
        targetId: id,
        action: suspend !== false ? 'suspend_channel' : 'unsuspend_channel',
        reason: reason || null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Admin channel suspend error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { requireAdmin } = await import('@/lib/auth-helpers')
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const channel = await db.channel.findUnique({ where: { id } })
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    await db.channel.delete({ where: { id } })

    await db.adminAction.create({
      data: {
        adminId: admin.id,
        targetType: 'channel',
        targetId: id,
        action: 'delete_channel',
        reason: 'Admin deletion',
      },
    })

    return NextResponse.json({ message: 'Channel deleted' })
  } catch (error) {
    console.error('Admin channel delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
