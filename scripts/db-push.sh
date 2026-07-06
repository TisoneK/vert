#!/usr/bin/env bash
#
# prisma db push — sync schema.prisma to the database.
#
# Use this when you've edited prisma/schema.prisma and want to apply the
# changes to your local dev DB (or to production, if DATABASE_URL points
# at prod). This is DESTRUCTIVE — Prisma will drop columns/tables that
# exist in the DB but not in the schema. Use prisma migrate dev for
# production-safe migrations instead.
#
# Usage:
#   ./scripts/db-push.sh              # push to whatever DATABASE_URL points at
#   DATABASE_URL=... ./scripts/db-push.sh  # override for this run
#
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo "Create a .env file with DATABASE_URL=... or pass it inline:" >&2
  echo "  DATABASE_URL='postgres://...' ./scripts/db-push.sh" >&2
  exit 1
fi

echo "→ Running prisma db push against: ${DATABASE_URL%%@*}@***"
exec bunx prisma db push
