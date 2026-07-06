import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { listMigrations } from '@/lib/migrations'

/**
 * GET /api/v1/admin/db-migrations
 *
 * Returns the full list of admin-managed migrations, each annotated
 * with `applied` and `appliedAt`. Used by the Database tab in the admin
 * dashboard to render the pending vs applied lists.
 *
 * Admin-only — migration filenames and apply timestamps are operational
 * metadata an attacker shouldn't see.
 */
export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const migrations = await listMigrations()

    return NextResponse.json({
      migrations,
      pendingCount: migrations.filter((m) => !m.applied).length,
      appliedCount: migrations.filter((m) => m.applied).length,
    })
  } catch (error) {
    console.error('Admin db-migrations list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
