import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-helpers'

/**
 * PATCH /api/v1/admin/users/[id]
 *
 * Update a user's role or active status. Used by the admin Users tab
 * to promote/demote users and suspend/unsuspend accounts.
 *
 * Body (all fields optional — only provided fields are updated):
 *   { role?: 'member' | 'admin', isActive?: boolean }
 *
 * Safety:
 *   - Admin-only (requireAdmin)
 *   - Prevents an admin from demoting themselves (avoids the "locked
 *     out of the only admin account" footgun)
 *   - Prevents an admin from deactivating themselves
 *   - Logs the action to AdminAction for audit
 *
 * Note: changing role or isActive does NOT invalidate the user's
 * existing JWT. The session-info endpoint reads these fields from the
 * DB on every request, so the change takes effect on the user's next
 * API call — but their existing JWT will still authenticate until it
 * expires. For isActive=false, the session-info endpoint returns
 * { user: null }, effectively logging them out.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { role, isActive } = body

    // Validate inputs
    const updates: Record<string, unknown> = {}
    if (role !== undefined) {
      if (!['member', 'admin'].includes(role)) {
        return NextResponse.json({ error: 'Role must be "member" or "admin"' }, { status: 400 })
      }
      updates.role = role
    }
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 })
      }
      updates.isActive = isActive
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent self-demotion and self-deactivation — avoids the "locked
    // out of the only admin account" footgun.
    if (id === admin.id) {
      if (updates.role === 'member') {
        return NextResponse.json(
          { error: 'Cannot demote yourself — ask another admin to demote you' },
          { status: 400 }
        )
      }
      if (updates.isActive === false) {
        return NextResponse.json(
          { error: 'Cannot deactivate your own account — ask another admin' },
          { status: 400 }
        )
      }
    }

    const updated = await db.user.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
      },
    })

    // Audit log
    const actions: string[] = []
    if (updates.role !== undefined) actions.push(`role:${updates.role}`)
    if (updates.isActive !== undefined) actions.push(updates.isActive ? 'activate' : 'deactivate')
    await db.adminAction.create({
      data: {
        adminId: admin.id,
        targetType: 'user',
        targetId: id,
        action: actions.join(','),
        reason: `Admin updated ${targetUser.username}'s account`,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/admin/users/[id]
 *
 * Hard-deletes a user account. Cascade-deletes their channel, videos,
 * comments, votes, subscriptions, playlists, notifications, etc. via
 * the schema's onDelete: Cascade rules.
 *
 * This is destructive and irreversible. Prefer PATCH { isActive: false }
 * to suspend an account — it preserves the user's content while
 * preventing them from signing in.
 *
 * Safety:
 *   - Admin-only
 *   - Prevents an admin from deleting themselves
 *   - Requires a confirm flag in the body: { confirm: true }
 *   - Logs to AdminAction
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (id === admin.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account — ask another admin' },
        { status: 400 }
      )
    }

    const body = await req.json().catch(() => ({}))
    if (!body?.confirm) {
      return NextResponse.json(
        { error: 'Confirmation required — pass { confirm: true } in the body' },
        { status: 400 }
      )
    }

    const targetUser = await db.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Cascade delete via the schema's onDelete: Cascade rules.
    // This will also delete the user's channel, videos, comments, etc.
    await db.user.delete({ where: { id } })

    await db.adminAction.create({
      data: {
        adminId: admin.id,
        targetType: 'user',
        targetId: id,
        action: 'delete_user',
        reason: `Admin deleted ${targetUser.username} (${targetUser.email})`,
      },
    })

    return NextResponse.json({ message: 'User deleted' })
  } catch (error) {
    console.error('Admin user delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
