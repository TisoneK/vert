import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { requireAdmin } = await import('@/lib/auth-helpers')
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }

    const [flags, total] = await Promise.all([
      db.flag.findMany({
        where,
        include: {
          video: {
            select: { id: true, title: true, thumbnailUrl: true },
          },
          reporter: {
            select: { id: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.flag.count({ where }),
    ])

    return NextResponse.json({
      flags,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin flags list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
