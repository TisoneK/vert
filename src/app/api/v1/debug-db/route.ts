import { NextResponse } from 'next/server'
import { db, withServerlessPoolParams } from '@/lib/db'

/**
 * GET /api/v1/debug-db
 *
 * Diagnostic endpoint that runs a trivial DB query and returns either:
 *   - { ok: true, latencyMs, categories } on success
 *   - { ok: false, errorName, errorMessage, errorStack } on failure
 *
 * WHY THIS EXISTS
 * ---------------
 * The production 500s across every DB-touching route were impossible to
 * diagnose from Vercel's request metadata alone — we needed the actual
 * Prisma error text (PrismaClientInitializationError vs connection-refused
 * vs pool-exhausted vs schema-mismatch, each needs a different fix).
 *
 * This endpoint surfaces that error. It's read-only and runs a single
 * findMany on Category (small table, no joins) so it's safe to hit
 * repeatedly while debugging.
 *
 * SECURITY: This route returns no user data, only DB-connectivity info.
 * It's intentionally public so it can be hit from a browser during an
 * outage. If you want to lock it down later, gate it behind auth.
 */
export async function GET() {
  const start = Date.now()
  try {
    const count = await db.category.count()
    const latencyMs = Date.now() - start
    return NextResponse.json({
      ok: true,
      latencyMs,
      categoryCount: count,
      // Echo back which URL Prisma is actually using (with pool params
      // redacted) so we can confirm the datasources override took effect.
      // Uses the same transform as db.ts — the raw env var never has
      // connection_limit since it's only added at runtime, in-memory.
      dbUrlShape: (() => {
        const effectiveUrl = withServerlessPoolParams(process.env.DATABASE_URL)
        if (!effectiveUrl) return null
        const parsed = new URL(effectiveUrl)
        return {
          protocol: parsed.protocol,
          host: parsed.host,
          hasConnectionLimit: effectiveUrl.includes('connection_limit='),
        }
      })(),
    })
  } catch (error) {
    const latencyMs = Date.now() - start
    return NextResponse.json(
      {
        ok: false,
        latencyMs,
        errorName: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
        // Don't echo the full URL — it contains the DB password.
        dbUrlPresent: !!process.env.DATABASE_URL,
        prismaDatabaseUrlPresent: !!process.env.PRISMA_DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      },
      { status: 500 }
    )
  }
}
