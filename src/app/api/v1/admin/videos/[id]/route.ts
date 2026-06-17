import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const video = await db.video.findUnique({ where: { id } })
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    await db.video.update({
      where: { id },
      data: { isRemoved: true },
    })

    await db.adminAction.create({
      data: {
        adminId: admin.id,
        targetType: 'video',
        targetId: id,
        action: 'remove_video',
        reason: 'Admin removal',
      },
    })

    return NextResponse.json({ message: 'Video removed' })
  } catch (error) {
    console.error('Admin video remove error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
