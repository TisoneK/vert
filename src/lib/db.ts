import { PrismaClient } from '@prisma/client'

/**
 * Lazily-instantiated, globally-cached Prisma client.
 *
 * WHY THIS MATTERS ON VERCEL
 * --------------------------
 * Every serverless function invocation can be a fresh Node process, and
 * even warm Lambdas can run route handlers in isolated module instances.
 * If each request calls `new PrismaClient()`, each one opens its own
 * connection pool — and Postgres (especially Neon / Vercel Postgres, which
 * cap concurrent connections) refuses new connections under burst load.
 * That's the root cause of the intermittent 500s across every DB-touching
 * route: a fresh page load fires 5+ concurrent fetches, each spawns a new
 * PrismaClient, each grabs a connection, and the pool is exhausted.
 *
 * THE FIX
 * -------
 * 1. Cache the PrismaClient on `globalThis` IN ALL ENVIRONMENTS — not just
 *    dev. The previous code only cached in non-production, which meant
 *    production (where it matters most) kept spawning new clients.
 * 2. Append `&connection_limit=1&pool_timeout=10` to the connection string
 *    at runtime so each client only holds one connection (the standard
 *    Prisma + serverless pattern).
 *
 * The lazy Proxy wrapper is preserved so that importing `db` is still safe
 * even if `prisma generate` hasn't run — the error only surfaces on first
 * actual query, not at import time.
 */

type PrismaGlobal = typeof globalThis & {
  __vertPrisma?: PrismaClient
}

const globalForPrisma = globalThis as PrismaGlobal

/**
 * Append serverless-friendly pool params to a Postgres connection URL.
 * Prisma accepts `connection_limit` and `pool_timeout` as query-string
 * params on the `url` (NOT on `directUrl` — that one is for migrations
 * and should use the full connection pool).
 *
 * If the URL already has these params (or isn't a postgres URL), return
 * it unchanged.
 *
 * Exported so /api/v1/debug-db can report the *actual* effective URL
 * shape Prisma uses at runtime, instead of the raw env var (which never
 * has these params — they're only added in-memory, not written back to
 * Vercel's env var storage).
 */
export function withServerlessPoolParams(url: string | undefined): string | undefined {
  if (!url) return url
  if (!url.startsWith('postgres')) return url
  if (url.includes('connection_limit=')) return url

  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}connection_limit=1&pool_timeout=10&connect_timeout=10`
}

function createPrismaClient(): PrismaClient {
  // Reuse the existing instance from the global cache if present.
  // This runs in ALL environments — production needs it most.
  if (globalForPrisma.__vertPrisma) {
    return globalForPrisma.__vertPrisma
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['query'] : ['error'],
    datasources: {
      db: {
        // Override the URL at runtime so we don't have to ask the user to
        // edit their Vercel env vars. directUrl (used by migrations) is
        // left untouched.
        url: withServerlessPoolParams(process.env.DATABASE_URL),
      },
    },
  })

  globalForPrisma.__vertPrisma = client

  return client
}

/**
 * Proxy that defers PrismaClient construction until first use.
 *
 * `import { db } from '@/lib/db'` is now safe even if the Prisma engine
 * binary is missing — the error only surfaces when code actually tries to
 * query `db.video.findMany(...)` etc.
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = createPrismaClient()
    const value = Reflect.get(client, prop, receiver)
    // Preserve method binding so `db.video.findMany(...)` still works.
    // Using a narrow function type rather than the banned `Function` type.
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value
  },
}) as PrismaClient
