#!/usr/bin/env bash
#
# prisma migrate dev — create + apply a proper migration.
#
# Use this for production schema changes. Unlike db push, this generates
# a migration SQL file in prisma/migrations/ that you can review, commit,
# and apply to prod via prisma migrate deploy.
#
# Usage:
#   ./scripts/db-migrate.sh add_watchhistory_unique
#   ./scripts/db-migrate.sh "add user last seen column"
#
set -euo pipefail
cd "$(dirname "$0")/.."

NAME="${1:-}"
if [ -z "$NAME" ]; then
  echo "Usage: $0 <migration-name>" >&2
  echo "Example: $0 add_watchhistory_unique" >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

echo "→ Creating migration: $NAME"
exec bunx prisma migrate dev --name "$NAME"
