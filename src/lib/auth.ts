import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      // Don't throw if env vars aren't set — just disable the provider
      // by returning empty strings. This lets the app run without Google
      // configured (e.g. during local dev).
      ...((!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
        ? { clientId: '', clientSecret: '' }
        : {}),
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Email or username and password are required')
        }

        const identifier = credentials.identifier.trim()

        // Username lookup is case-insensitive — registration preserves the
        // original case ("John"), so an exact match would reject a login
        // typed as "john". Email is already lowercased on both sides.
        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: identifier.toLowerCase() },
              { username: { equals: identifier, mode: 'insensitive' } },
            ],
          },
        })

        if (!user || !user.passwordHash) {
          throw new Error('Invalid email/username or password')
        }

        if (!user.isActive) {
          throw new Error('Account is deactivated')
        }

        const isValid = await compare(credentials.password, user.passwordHash)
        if (!isValid) {
          throw new Error('Invalid email/username or password')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth: auto-create the user if they don't exist yet
      if (account?.provider === 'google' && user.email) {
        const existing = await db.user.findUnique({
          where: { email: user.email.toLowerCase() },
        })

        if (!existing) {
          // Create a new user from Google profile data
          const username = (user.name || user.email?.split('@')[0] || 'user')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 20)

          // Ensure username is unique
          let uniqueUsername = username
          let suffix = 1
          while (
            await db.user.findUnique({ where: { username: uniqueUsername } })
          ) {
            uniqueUsername = `${username}${suffix}`
            suffix++
          }

          await db.user.create({
            data: {
              email: user.email.toLowerCase(),
              username: uniqueUsername,
              role: 'member',
              isActive: true,
              emailVerified: true,
              oauthProvider: 'google',
              avatarUrl: user.image || null,
              channel: {
                create: {
                  channelName: uniqueUsername,
                },
              },
            },
          })
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // Always load the role from DB — the user object from authorize()
        // may not include role because NextAuth's User type doesn't have it.
        // This is more reliable than casting.
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true, username: true },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.username = dbUser.username
        } else if (user.email) {
          // Fallback for Google sign-in where user.id might not be set yet
          const byEmail = await db.user.findUnique({
            where: { email: user.email.toLowerCase() },
            select: { id: true, role: true, username: true },
          })
          if (byEmail) {
            token.id = byEmail.id
            token.role = byEmail.role
            token.username = byEmail.username
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string
        ;(session.user as { role: string }).role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
