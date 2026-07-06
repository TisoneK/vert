#!/usr/bin/env bash
#
# promote-admin.ts — promote a user to admin role.
#
# One-off script to restore admin access after the demo accounts were
# cleaned up by /api/cleanup-demo. The cleanup deleted admin@vert.com
# (along with user1-5@vert.com); if you've re-registered admin@vert.com
# via the signup form, it has role='member' and can't reach /admin.
#
# This script connects to the DB via Prisma (same client the app uses)
# and UPDATEs the User.role column. Run it locally with your DATABASE_URL
# from Vercel:
#
#   DATABASE_URL='postgres://...' bun scripts/promote-admin.sh admin@vert.com
#
# Or get the URL from Vercel CLI:
#
#   vercel env pull .env.local --environment=production
#   bun scripts/promote-admin.sh admin@vert.com
#
# The script is idempotent — if the user is already admin, it reports
# that and exits 0.
#
set -euo pipefail
cd "$(dirname "$0")/.."

EMAIL="${1:-admin@vert.com}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo "" >&2
  echo "Get it from Vercel:" >&2
  echo "  vercel env pull .env.local --environment=production" >&2
  echo "Then run:" >&2
  echo "  DATABASE_URL='postgres://...' bun scripts/promote-admin.sh $EMAIL" >&2
  exit 1
fi

echo "→ Promoting $EMAIL to admin role..."
exec bun run --env-file=.env.local scripts/promote-admin.ts "$EMAIL"
