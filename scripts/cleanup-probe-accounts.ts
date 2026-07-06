/**
 * cleanup-probe-accounts.ts — delete accounts created during the review.
 *
 * During the code review, I probed whether the demo accounts still
 * existed by trying to register admin@vert.com and user1@vert.com.
 * Both registrations succeeded (confirming the accounts had been
 * deleted by /api/cleanup-demo earlier), but the side effect was that
 * two member-role accounts now exist in production that shouldn't.
 *
 * This script deletes them. Safety:
 *   - Only deletes the exact probe emails (no wildcards)
 *   - Only deletes accounts with role='member' (won't touch a promoted
 *     admin@vert.com)
 *   - Cascades to channels, subscriptions, etc. via the schema's
 *     onDelete: Cascade rules
 *
 * Run via scripts/cleanup-probe-accounts.sh.
 */
import { PrismaClient } from '@prisma/client'

const PROBE_EMAILS = [
  'admin@vert.com',  // created during review probing — will NOT delete if promoted to admin
  'user1@vert.com',  // created during review probing
]

const prisma = new PrismaClient()

async function main() {
  for (const email of PROBE_EMAILS) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true, role: true, channel: { select: { id: true, channelName: true } } },
    })

    if (!user) {
      console.log(`  ${email}: not found (already deleted)`)
      continue
    }

    if (user.role === 'admin') {
      console.log(`  ${email}: SKIPPED — role is 'admin' (you promoted it via promote-admin.sh, keeping it)`)
      continue
    }

    console.log(`  ${email}: deleting (username: ${user.username}, role: ${user.role})`)
    if (user.channel) {
      console.log(`    channel: ${user.channel.channelName} (${user.channel.id}) — will cascade-delete`)
    }

    await prisma.user.delete({ where: { id: user.id } })
    console.log(`    ✓ deleted`)
  }

  console.log('')
  console.log('✓ Cleanup complete.')
}

main()
  .catch((err) => {
    console.error('✗ Failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
