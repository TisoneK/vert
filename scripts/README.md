# Vert — Database Scripts

Shell scripts for common Prisma / database operations. All scripts read
`DATABASE_URL` from your environment (or `.env` file) — none of them
hardcode credentials.

## Quick reference

| Script | What it does | When to use |
|---|---|---|
| `db-push.sh` | `prisma db push` — sync schema to DB | Local dev only (destructive) |
| `db-migrate.sh <name>` | `prisma migrate dev --name <name>` | Creating a new migration |
| `db-status.sh` | `prisma migrate status` | Check pending migrations |
| `db-deploy.sh` | `prisma migrate deploy` | CI/CD or manual prod deploy |
| `db-studio.sh` | `prisma studio` | Open DB browser GUI |
| `apply-admin-migrations.sh` | Apply SQL files from `prisma/migrations/admin/` | Applying admin-managed migrations via CLI |

## Admin-managed migrations (`prisma/migrations/admin/`)

These are SQL files applied **outside** of Prisma's migrate system. They
exist so that schema changes can be triggered from the **admin UI** (see
the Database tab at `/admin`) as well as from the CLI.

Each file is named `YYYYMMDDHHMMSS_description.sql` and runs in a single
transaction. Applied migrations are tracked in the `_admin_migration`
table, so the UI and CLI stay in sync.

### Applying via CLI

```bash
# List pending migrations without applying
./scripts/apply-admin-migrations.sh --dry-run

# Apply all pending
DATABASE_URL='postgres://...' ./scripts/apply-admin-migrations.sh
```

### Applying via admin UI

1. Sign in as an admin.
2. Go to `/admin` → Database tab.
3. Click "Apply" next to each pending migration.

## When to use what

- **`db-migrate.sh`** for normal schema changes during development. This
  creates a migration file in `prisma/migrations/` that Prisma tracks.
- **`db-deploy.sh`** in CI/CD to apply Prisma migrations to production.
- **`apply-admin-migrations.sh`** (or the admin UI) for schema changes
  that need to be applied at runtime by an admin, without a full deploy.
  These are typically hotfixes or indexes that can't wait for the next
  deploy cycle.

## Required environment variables

```
DATABASE_URL=postgres://user:pass@host:port/db?schema=public
```

For Prisma Postgres, you may also need:

```
PRISMA_DATABASE_URL=postgres://user:pass@host:port/db?schema=public
```

(`directUrl` in `schema.prisma` — used for migrations.)
