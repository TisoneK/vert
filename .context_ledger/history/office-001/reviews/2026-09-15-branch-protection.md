# Report — 2026-09-15 — Session 47: `main` branch protection (TisoneK/vert)

**Trigger:** GitHub nudge shown to the owner — "Your main branch isn't
protected. Protect this branch from force pushing or deletion, or
require status checks before merging."

**What was done (no repo code changed — GitHub settings only):**

- Enabled classic branch protection on `main` via
  `PUT /repos/TisoneK/vert/branches/main/protection`, using this
  machine's Git Credential Manager OAuth token (`repo` scope) resolved
  non-interactively with `git credential fill` — the same credential
  pushes already use. No PAT was created, stored, or echoed.
- Active rules (verified via `GET .../protection`):
  - **Force pushes blocked** (`allow_force_pushes: false`)
  - **Branch deletion blocked** (`allow_deletions: false`)
  - **Admin enforcement ON** (`enforce_admins: true`) — rules apply to
    the owner too, and cannot be bypassed on GitHub Free/Team.
  - **Deliberately NOT enabled:** required PR reviews, required status
    checks, merge restrictions, linear history. This repo's standing
    push policy (workflows/active.md) is "push to main directly after
    each commit" — requiring PRs/checks would block every ordinary
    session push. Normal fast-forward pushes are unaffected by the two
    rules that were enabled. If the owner later wants CI-gated merges,
    the API can add `required_status_checks` without touching anything
    else.

**Protocol notes:**

- `context-sync verify` false-failed exactly as logged in the open
  2026-09-02 CRLF flaw: all files "missing"/failing because the script
  hashes CRLF checkouts against LF manifest blobs. Hand-verified
  integrity instead: all 44 `git show HEAD:.context/core/<file>` blob
  hashes match `MANIFEST.sha256` — tree pristine, **no rollback run**
  (rollback would loop the same false-fail).
- `context-sync status`: upstream core **1.1.2** vs vendored **0.8.0**
  — MAJOR bump, needs owner go-ahead → backlog item added.
- Pre-existing uncommitted change found in the tree:
  `prisma/seed.ts` (watch-history sampling now dedupes videos per
  user). Not this session's work — left untouched and uncommitted,
  flagged to the owner.
