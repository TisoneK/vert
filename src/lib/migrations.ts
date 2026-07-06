import fs from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'

/**
 * Admin-managed migration runner.
 *
 * WHY THIS EXISTS
 * ---------------
 * Prisma's own migrate system (`prisma migrate deploy`) is the right tool
 * for schema changes that ship with a deploy. But some schema changes
 * need to happen *now*, without a full deploy cycle — e.g., adding an
 * index that the code already depends on, or hotfixing a missing
 * constraint.
 *
 * This runner reads SQL files from `prisma/migrations/admin/`, applies
 * them one at a time inside a transaction, and records each applied
 * migration in the `_admin_migration` table. The admin UI (Database tab
 * in /admin) and the CLI script (`scripts/apply-admin-migrations.sh`)
 * both use this same tracking table, so they stay in sync.
 *
 * WHY NOT JUST `prisma db push`?
 * ------------------------------
 * `prisma db push` is destructive — it diffs the schema against the DB
 * and drops anything that doesn't match. Running it against prod without
 * a careful review is dangerous. It also requires the `prisma` CLI
 * binary, which isn't bundled in the Vercel serverless image.
 *
 * This runner uses only `prisma.$executeRaw` / `$queryRaw`, which work
 * inside a serverless function. Each migration is a hand-reviewed SQL
 * file committed to the repo.
 *
 * FILE NAMING
 * -----------
 * Migrations are named `YYYYMMDDHHMMSS_description.sql` (timestamp prefix
 * for sort order, like Prisma's own migrate). The `id` is the filename
 * without the `.sql` extension.
 *
 * SAFETY
 * ------
 * - Each migration runs inside a `db.$transaction` — if the SQL fails,
 *   the `_admin_migration` insert is rolled back, so the migration can
 *   be retried.
 * - The runner re-checks `applied` status inside the transaction to
 *   prevent races between two admins clicking "Apply" at the same time.
 * - Migration IDs are validated against the file list — no path
 *   traversal, no arbitrary SQL injection.
 * - SQL files are committed to the repo — no user input goes into the
 *   SQL.
 */

const MIGRATIONS_DIR = path.join(process.cwd(), 'prisma', 'migrations', 'admin')

export interface Migration {
  /** Filename without the .sql extension, e.g. "20260706000002_watchhistory_unique" */
  id: string
  /** Full filename including .sql */
  filename: string
  /** Human-readable description parsed from the filename */
  description: string
  /** Whether this migration has been applied to the current DB */
  applied: boolean
  /** When it was applied (if applied) */
  appliedAt?: Date
}

/**
 * Ensure the _admin_migration tracking table exists.
 *
 * This is the bootstrap problem: the runner needs the table to track
 * migrations, but the table itself is created by a migration. We solve
 * it by running `CREATE TABLE IF NOT EXISTS` on every call — cheap and
 * idempotent.
 */
async function ensureMigrationTable(): Promise<void> {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_admin_migration" (
      "id"         VARCHAR(255) PRIMARY KEY,
      "applied_at" TIMESTAMP   NOT NULL DEFAULT NOW()
    );
  `)
}

/**
 * Parse a migration filename into a human-readable description.
 *
 * "20260706000002_watchhistory_unique" → "Watchhistory unique"
 */
function parseDescription(id: string): string {
  // Strip the timestamp prefix (first underscore-separated token)
  const parts = id.split('_')
  const nameParts = parts.slice(1)
  if (nameParts.length === 0) return id
  // Join with spaces, capitalize first letter of each word
  return nameParts
    .join(' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * List all migrations on disk, annotated with their applied status.
 *
 * Returns migrations in filename order (oldest first). If the
 * migrations directory doesn't exist or is empty, returns an empty
 * array — never throws.
 */
export async function listMigrations(): Promise<Migration[]> {
  await ensureMigrationTable()

  let files: string[]
  try {
    files = await fs.readdir(MIGRATIONS_DIR)
  } catch {
    // Directory doesn't exist — no migrations to apply.
    return []
  }

  const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort()

  if (sqlFiles.length === 0) return []

  // Fetch applied migrations in one query — cheaper than per-file lookups.
  const applied = await db.$queryRaw<{ id: string; applied_at: Date }[]>`
    SELECT id, applied_at FROM "_admin_migration" ORDER BY id
  `
  const appliedMap = new Map(applied.map((a) => [a.id, a.applied_at]))

  return sqlFiles.map((filename) => {
    const id = filename.replace(/\.sql$/, '')
    const appliedAt = appliedMap.get(id)
    return {
      id,
      filename,
      description: parseDescription(id),
      applied: !!appliedAt,
      appliedAt,
    }
  })
}

/**
 * Split a SQL string into individual statements.
 *
 * Prisma's $executeRawUnsafe supports multi-statement SQL on Postgres,
 * but to be safe (and to support other drivers if we ever switch), we
 * split on semicolons. Handles:
 *   - Line comments (-- ...)
 *   - Block comments (/* ... *\/)
 *   - Single-quoted strings ('...')
 *   - Double-quoted identifiers ("...")
 */
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inString = false
  let stringChar = ''
  let inLineComment = false
  let inBlockComment = false

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    const next = sql[i + 1]
    const prev = sql[i - 1]

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false
      }
      continue
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false
        i++ // skip the /
      }
      continue
    }
    if (inString) {
      current += ch
      if (ch === stringChar && prev !== '\\') {
        inString = false
      }
      continue
    }

    // Not in a string or comment — check for comment/string starts
    if (ch === '-' && next === '-') {
      inLineComment = true
      i++ // skip the next -
      continue
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true
      i++ // skip the *
      continue
    }
    if (ch === "'" || ch === '"') {
      inString = true
      stringChar = ch
      current += ch
      continue
    }
    if (ch === ';') {
      const trimmed = current.trim()
      if (trimmed) statements.push(trimmed)
      current = ''
      continue
    }
    current += ch
  }

  const trimmed = current.trim()
  if (trimmed) statements.push(trimmed)
  return statements
}

/**
 * Apply a single migration by ID.
 *
 * - Reads the SQL file from disk.
 * - Runs each statement inside a `db.$transaction`.
 * - Inserts a row into `_admin_migration` at the end of the same
 *   transaction, so the apply + the record are atomic.
 * - Re-checks `applied` status inside the transaction to prevent races
 *   between two concurrent admin clicks.
 *
 * @throws if the migration doesn't exist, is already applied, or the
 *         SQL fails. The caller should surface the error to the admin.
 */
export async function applyMigration(id: string): Promise<{ appliedAt: Date }> {
  await ensureMigrationTable()

  // Validate the ID against the actual file list — prevents path
  // traversal (e.g. `../../../etc/passwd`) and arbitrary SQL injection.
  const migrations = await listMigrations()
  const migration = migrations.find((m) => m.id === id)
  if (!migration) {
    throw new Error(`Migration not found: ${id}`)
  }
  if (migration.applied) {
    throw new Error(`Migration already applied: ${id}`)
  }

  const sqlPath = path.join(MIGRATIONS_DIR, migration.filename)
  const sql = await fs.readFile(sqlPath, 'utf8')
  const statements = splitSqlStatements(sql)

  const appliedAt = new Date()

  await db.$transaction(async (tx) => {
    // Re-check inside the transaction to prevent races.
    const already = await tx.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int as count FROM "_admin_migration" WHERE id = ${id}
    `
    if (already[0]!.count > 0) {
      throw new Error(`Migration already applied (race): ${id}`)
    }

    // Run each statement in order. If any fails, the whole transaction
    // rolls back — including the _admin_migration insert below.
    for (const stmt of statements) {
      await tx.$executeRawUnsafe(stmt)
    }

    // Record the migration in the same transaction.
    await tx.$executeRaw`
      INSERT INTO "_admin_migration" (id, applied_at) VALUES (${id}, ${appliedAt.toISOString()})
    `
  })

  return { appliedAt }
}
