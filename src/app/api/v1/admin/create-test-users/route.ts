import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

/**
 * POST /api/v1/admin/create-test-users
 *
 * Generates test accounts with channels for QA/demo purposes. Only admins
 * can call this. Each generated user gets:
 *   - A predictable email (testuser_N@vert.com) and password (testpass123)
 *   - A channel with a name and description
 *   - The 'member' role (not admin)
 *
 * Body: { count: number } — how many test accounts to create (1-20, default 3)
 *
 * Returns the generated credentials so the admin can copy them for testing.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const count = Math.min(Math.max(parseInt(body.count, 10) || 3, 1), 20)

    const password = 'testpass123'
    const passwordHash = await hash(password, 12)

    // Generate unique usernames/emails. We append a timestamp-based suffix
    // so repeated calls don't collide with previously-created test accounts.
    const stamp = Date.now().toString(36).slice(-5)
    const testUsers: Array<{ email: string; username: string; password: string; channelName: string }> = []

    // Channel name pool — cycles through these for variety
    const channelNames = [
      'Test Creator', 'Demo Channel', 'QA Tester', 'Sample Studio',
      'Portrait Pro', 'Vertical Vibes', 'Short Form Lab', 'Clip Creator',
      'Mobile Moments', 'Quick Clips', 'Story Studio', 'Reel Tester',
      'Portrait Pulse', 'Vertical Vision', 'Short Story', 'Clip Lab',
      'Moment Maker', 'Frame Tester', 'Pixel Portrait', 'Vertical Vault',
    ]

    for (let i = 0; i < count; i++) {
      const username = `testuser_${stamp}_${i + 1}`
      const email = `${username}@test.vert.com`
      const channelName = channelNames[i % channelNames.length]

      // Skip if somehow already exists (shouldn't happen with the timestamp
      // suffix, but be safe)
      const existing = await db.user.findUnique({
        where: { email },
        select: { id: true },
      })
      if (existing) {
        continue
      }

      await db.user.create({
        data: {
          email,
          username,
          passwordHash,
          role: 'member',
          isActive: true,
          emailVerified: true,
          channel: {
            create: {
              channelName,
              description: `Test channel created by admin for QA purposes. Channel #${i + 1} of batch ${stamp}.`,
            },
          },
        },
      })

      testUsers.push({ email, username, password, channelName })
    }

    // Audit log
    await db.adminAction.create({
      data: {
        adminId: admin.id,
        targetType: 'user',
        targetId: 'batch',
        action: `Created ${testUsers.length} test user(s) (batch ${stamp})`,
      },
    })

    return NextResponse.json({
      created: testUsers.length,
      users: testUsers,
      note: 'All test accounts use the same password: testpass123. They have the member role and a channel.',
    })
  } catch (error) {
    console.error('Create test users error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
