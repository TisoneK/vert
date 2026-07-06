/**
 * promote-admin.ts — promote a user to admin role.
 *
 * Run via scripts/promote-admin.sh (which sets up the env file) or directly:
 *
 *   DATABASE_URL='postgres://...' bun scripts/promote-admin.ts admin@vert.com
 *
 * Idempotent: if the user is already admin, reports that and exits 0.
 */
import { PrismaClient } from '@prisma/client'

const email = (process.argv[2] || 'admin@vert.com').toLowerCase().trim()

if (!email) {
  console.error('Usage: bun scripts/promote-admin.ts <email>')
  process.exit(1)
}

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, username: true, role: true },
  })

  if (!user) {
    console.error(`✗ User not found: ${email}`)
    console.error('')
    console.error('  Register the account first via the signup form at')
    console.error('  https://vert-wine.vercel.app/signup, then re-run this script.')
    process.exit(1)
  }

  if (user.role === 'admin') {
    console.log(`✓ ${email} is already admin (username: ${user.username})`)
    return
  }

  console.log(`  Current role: ${user.role}`)
  console.log(`  Username:     ${user.username}`)

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'admin' },
    select: { id: true, email: true, username: true, role: true },
  })

  console.log(`✓ Promoted to admin:`)
  console.log(`    id:       ${updated.id}`)
  console.log(`    email:    ${updated.email}`)
  console.log(`    username: ${updated.username}`)
  console.log(`    role:     ${updated.role}`)
  console.log('')
  console.log('  Sign out and back in to refresh the JWT role claim.')
  console.log('  Then visit https://vert-wine.vercel.app/admin')
}

main()
  .catch((err) => {
    console.error('✗ Failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
