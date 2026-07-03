import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return {
    id: (session.user as { id: string }).id,
    email: session.user.email!,
    username: session.user.name!,
    role: (session.user as { role: string }).role,
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) return null
  return user
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}
