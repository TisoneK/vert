# Backlog (append-only)

Open items for future sessions. Append at the bottom; never delete or
reorder. When an item is done, check it off and note the session/commit —
don't remove the line.

<!-- TEMPLATE — copy below the last entry:
---
- [ ] **<short title>** (added YYYY-MM-DD by <agent>) — <enough context that
      a fresh agent can act on this without any chat history. Severity if known.>
-->

---
- [ ] **Resolve dual lockfiles** (added 2026-07-11 by Claude Code) — both
      `bun.lock` and `package-lock.json` are committed. Two package managers'
      lockfiles drift independently and cause false-positive audit alerts /
      divergent dependency trees across machines. Pick one authoritative
      manager and delete the other lockfile. Low severity; tooling decision,
      not a code fix. Note: `bun` is not installed on Baos-Mac-mini, so npm is
      the de-facto local manager there. See 2026-07-11 review [L-1].
- [ ] **Route `seed`/`cleanup-demo` through the shared `db` singleton** (added
      2026-07-11 by Claude Code) — `src/app/api/seed/route.ts` and
      `src/app/api/cleanup-demo/route.ts` instantiate `new PrismaClient()`
      directly instead of the lazy pooled singleton in `src/lib/db.ts`,
      bypassing the serverless pool params. Acceptable for one-off ops
      endpoints but worth aligning. Low severity. See review [L-2].
- [ ] **Add a test suite + CI** (added 2026-07-11 by Claude Code) — no test
      runner configured (documented in ARCHITECTURE.md §4). Recommended:
      Vitest (unit) + Playwright (E2E), plus a GitHub Actions workflow running
      typecheck + lint + build on PRs. When tests land, backfill a regression
      test for the 400-on-malformed-body fix (commit b21a094). See review [L-3].
