import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { videos: true },
        },
      },
    })

    const result = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      iconUrl: cat.iconUrl,
      videoCount: cat._count.videos,
    }))

    return NextResponse.json({ categories: result })
  } catch (error) {
    console.error('Categories list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
