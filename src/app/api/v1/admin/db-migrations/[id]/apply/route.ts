import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { applyMigration } from '@/lib/migrations'

/**
 * POST /api/v1/admin/db-migrations/[id]/apply
 *
 * Applies a single admin-managed migration by ID. The ID must match a
 * filename in prisma/migrations/admin/ (without the .sql extension) —
 * the runner validates this, so there's no path-traversal risk.
 *
 * The migration runs inside a transaction: if the SQL fails, the
 * tracking-row insert is rolled back, so the migration can be retried.
 *
 * Admin-only. Returns 409 if the migration is already applied.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params

    // Basic ID format check — must be alphanumeric + underscores.
    // The runner also validates against the file list, but this catches
    // obviously bad input early.
    if (!/^[a-zA-Z0-9_]+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid migration ID' }, { status: 400 })
    }

    const result = await applyMigration(id)
    return NextResponse.json({ ok: true, id, appliedAt: result.appliedAt })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'

    // Distinguish 'already applied' (409) from 'not found' (404) from
    // real errors (500) so the admin UI can show the right message.
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    if (message.includes('already applied')) {
      return NextResponse.json({ error: message }, { status: 409 })
    }

    console.error('Admin db-migration apply error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
