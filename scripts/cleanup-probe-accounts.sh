#!/usr/bin/env bash
#
# cleanup-probe-accounts.sh — delete the accounts created during the
# review session when probing whether the demo accounts still existed.
#
# When I ran the review, I tried to register admin@vert.com and
# user1@vert.com to check if they'd been deleted (they had — the
# /api/cleanup-demo endpoint removed them earlier). Those probe
# registrations succeeded and created two member-role accounts that
# you probably don't want lying around in production.
#
# This script deletes them. It only deletes accounts that:
#   - Match the probe emails exactly (admin@vert.com, user1@vert.com)
#   - Have role='member' (won't delete a real admin@vert.com if you've
#     promoted it via promote-admin.sh)
#
# Run locally with your DATABASE_URL:
#
#   DATABASE_URL='postgres://...' bun scripts/cleanup-probe-accounts.ts
#
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

exec bun run --env-file=.env.local scripts/cleanup-probe-accounts.ts
