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
    const { status, reason } = body

    const validStatuses = ['pending', 'reviewed', 'actioned', 'dismissed']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 })
    }

    const flag = await db.flag.findUnique({ where: { id } })
    if (!flag) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 })
    }

    const updated = await db.flag.update({
      where: { id },
      data: { status },
    })

    // Log admin action
    await db.adminAction.create({
      data: {
        adminId: admin.id,
        targetType: 'flag',
        targetId: id,
        action: `flag_status_${status}`,
        reason: reason || null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Admin flag update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
