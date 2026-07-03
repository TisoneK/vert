import { PrismaClient } from '@prisma/client'

/**
 * Lazily-instantiated Prisma client.
 *
 * Previous implementation called `new PrismaClient()` at module top-level,
 * which meant that if `prisma generate` hadn't been run (or its native
 * query-engine binary was missing/blocked), the import itself would throw:
 *
 *   Error: @prisma/client did not initialize yet. Please run
 *   "prisma generate" and try to import it again.
 *
 * Because `db.ts` is imported (transitively) by `auth.ts` → `auth-helpers.ts`
 * → nearly every API route, that single import-time crash cascaded into the
 * entire site returning 500 — including `/api/auth/session-info`, which
 * `VertApp` fetches on mount, so the UI never got past the loading skeleton.
 *
 * Fix: wrap the client in a lazy getter. Now:
 *   - Importing `db` is always safe.
 *   - The actual `PrismaClient` constructor only runs on first property
 *     access (i.e. on the first query from a route that actually uses the DB).
 *   - If `prisma generate` hasn't been run, only that one route fails — every
 *     other route (and the entire UI shell) still renders.
 *
 * The global-cache pattern is preserved so we don't spawn a new client on
 * every hot-reload in dev (which would exhaust DB connections).
 */

type PrismaGlobal = typeof globalThis & {
  __vertPrisma?: PrismaClient
}

const globalForPrisma = globalThis as PrismaGlobal

function createPrismaClient(): PrismaClient {
  // Reuse the existing instance from the global cache if present (dev HMR)
  if (globalForPrisma.__vertPrisma) {
    return globalForPrisma.__vertPrisma
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['query'] : ['error'],
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.__vertPrisma = client
  }

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
