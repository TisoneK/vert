#!/usr/bin/env bash
#
# prisma studio — open the DB browser GUI.
#
# Opens a web-based spreadsheet view of your database at localhost:5555.
# Great for quick inspection / one-off edits during local dev.
#
# Usage:
#   ./scripts/db-studio.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

echo "→ Opening Prisma Studio at http://localhost:5555"
exec bunx prisma studio
