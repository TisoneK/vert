import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/v1/tags
 *
 * Returns popular tags, optionally filtered by search query.
 *
 * Query params:
 *   ?q=<substring>     -> filter by name (case-insensitive substring)
 *   ?limit=20           -> default 20, max 100
 *   ?sort=popular       -> default "popular" (usageCount desc); alternative: "alphabetical"
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()
    const limitParam = parseInt(searchParams.get('limit') || '20', 10)
    const limit = Math.min(Math.max(limitParam || 20, 1), 100)
    const sort = searchParams.get('sort') === 'alphabetical' ? 'alphabetical' : 'popular'

    const where = q
      ? { name: { contains: q.toLowerCase() } }
      : {}

    const orderBy = sort === 'alphabetical'
      ? { name: 'asc' as const }
      : { usageCount: 'desc' as const }

    const tags = await db.tag.findMany({
      where,
      orderBy,
      take: limit,
      select: {
        id: true,
        name: true,
        label: true,
        usageCount: true,
      },
    })

    // Cache popular tags for 2min at the edge. The landing page fetches
    // these on every visit. Only applies when no search query is set —
    // search queries shouldn't be cached because they're user-specific.
    const response = NextResponse.json({ tags })
    if (!q) {
      response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
    }
    return response
  } catch (error) {
    console.error('Tags list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
