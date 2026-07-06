#!/usr/bin/env bash
#
# prisma migrate deploy — apply pending migrations to prod.
#
# Use this in CI/CD or manually against the production DATABASE_URL.
# Applies all migrations in prisma/migrations/ that haven't been applied
# yet, in order. Non-interactive — safe for automated deploys.
#
# Usage:
#   DATABASE_URL='postgres://...' ./scripts/db-deploy.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

echo "→ Deploying pending migrations to: ${DATABASE_URL%%@*}@***"
exec bunx prisma migrate deploy
