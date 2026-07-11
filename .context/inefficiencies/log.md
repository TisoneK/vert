# Inefficiency Log (append-only, mandatory)

Every session appends one block — honestly. Friction you absorb silently
is friction the next agent hits blind. "None this session" is valid only
if literally nothing slowed you down.

<!-- TEMPLATE — copy below the last entry:
---
## YYYY-MM-DD — <agent> / <model>
- **Problem:** <what went wrong or was slower than it should be>
- **Cost:** <rough time/effort wasted>
- **Cause:** <root cause if known>
- **Workaround / fix:** <what worked, or "unresolved">
- **Prevent next time:** <protocol/context change that would have avoided it>
-->

---
## 2026-07-11 — Claude Code / claude-opus-4-8
- **Problem:** Dual lockfiles (`bun.lock` + `package-lock.json`) plus `bun`
  not installed on this machine, while several `package.json` scripts
  (`start`, `db:seed`) hard-require `bun`. Ambiguous which package manager /
  dev command is correct on this environment.
- **Cost:** Minor — a few checks to confirm npm + `next dev` is the right local
  path (baseline install was already present, so no failed install).
- **Cause:** Repo supports both bun (canonical, per README) and npm (fallback);
  this machine only has npm/node.
- **Workaround / fix:** Used npm and `next dev`; recorded the machine's
  bun-absence and the npm path in `.context/system/environments.md`. Backlogged
  the dual-lockfile cleanup.
- **Prevent next time:** Next agent on this machine: read
  `system/environments.md` first — npm + `next dev`, no bun, no psql. Don't run
  bun-only scripts here.
