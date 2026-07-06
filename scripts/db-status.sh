#!/usr/bin/env bash
#
# prisma migrate status — show pending vs applied migrations.
#
# Lists migrations in prisma/migrations/ and shows which have been
# applied to the DATABASE_URL database. Safe to run anytime — read-only.
#
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

exec bunx prisma migrate status
