#!/usr/bin/env bash
#
# Apply admin-managed SQL migrations from prisma/migrations/admin/.
#
# These are SQL files applied directly via psql, outside of Prisma's
# migrate system. They're used for schema changes that need to happen
# atomically and can be triggered from the admin UI (see the Database
# tab in /admin) or from this script for CLI use.
#
# The script tracks applied migrations in the _admin_migration table,
# same as the admin UI — so migrations applied here show up as "applied"
# in the UI, and vice versa.
#
# Usage:
#   ./scripts/apply-admin-migrations.sh              # apply all pending
#   ./scripts/apply-admin-migrations.sh --dry-run    # list pending, don't apply
#
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

MIGRATIONS_DIR="prisma/migrations/admin"
DRY_RUN=false
[ "${1:-}" = "--dry-run" ] && DRY_RUN=true

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "No admin migrations directory found ($MIGRATIONS_DIR)"
  exit 0
fi

# Ensure the tracking table exists (idempotent)
psql "$DATABASE_URL" -q -c '
  CREATE TABLE IF NOT EXISTS "_admin_migration" (
    "id" VARCHAR(255) PRIMARY KEY,
    "applied_at" TIMESTAMP NOT NULL DEFAULT NOW()
  );
' 2>&1 | grep -v "^$" || true

# Get list of already-applied migrations
APPLIED=$(psql "$DATABASE_URL" -t -A -c 'SELECT id FROM "_admin_migration" ORDER BY id' 2>/dev/null || echo "")

# List pending SQL files
PENDING=()
while IFS= read -r file; do
  [ -z "$file" ] && continue
  id=$(basename "$file" .sql)
  if echo "$APPLIED" | grep -qx "$id"; then
    continue  # already applied
  fi
  PENDING+=("$file")
done < <(find "$MIGRATIONS_DIR" -name '*.sql' | sort)

if [ ${#PENDING[@]} -eq 0 ]; then
  echo "✓ All admin migrations already applied."
  exit 0
fi

echo "Pending admin migrations:"
for file in "${PENDING[@]}"; do
  echo "  - $(basename "$file" .sql)"
done

if $DRY_RUN; then
  echo "(dry-run mode — no changes made)"
  exit 0
fi

echo ""
for file in "${PENDING[@]}"; do
  id=$(basename "$file" .sql)
  echo "→ Applying $id ..."
  # Run migration SQL + record in a transaction
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f "$file"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO \"_admin_migration\" (id) VALUES ('$id')"
  echo "  ✓ Applied $id"
done

echo ""
echo "✓ All admin migrations applied."
