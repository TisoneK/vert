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

---
## 2026-07-11 — Claude Code / claude-opus-4-8 (2)
- **Problem:** A backgrounded `eslint .` baseline run's captured output was
  truncated to just the header, and I read exit code 0 from the wrapping
  compound command — so I initially recorded a FALSE "lint clean (0 errors)"
  baseline and wrote it into the report + session entry. The real baseline is
  35 errors + 32 warnings (pre-existing, all in components/hooks/lib).
- **Cost:** Moderate — had to re-run eslint, re-verify error locations, and
  correct the report, session entry, and environments doc after the fact.
- **Cause:** Trusted an exit code + truncated background-task output instead of
  the eslint problem-summary line. The wrapping `{ ...; echo EXIT:$?; }` in a
  backgrounded compound command didn't reflect eslint's real exit status.
- **Workaround / fix:** Re-ran `npx eslint .` in the foreground and read the
  `✖ N problems (E errors, W warnings)` summary directly. Caught only because a
  personal memory note flagged "~32 pre-existing errors" — the contradiction
  prompted re-verification.
- **Prevent next time:** For lint/test baselines, always parse the printed
  problem-summary line; never conclude "clean" from an exit code alone,
  especially from a backgrounded/`tee`'d capture. Recorded the same warning in
  `system/environments.md`.

---
## 2026-07-14 — Claude Code / claude-fable-5
- **Problem:** Local functional testing of DB-touching flows impossible:
  `npx prisma dev` fails (npm EACCES on root-owned `~/.npm/_cacache` files),
  so the dev DB on localhost:51214 never starts. Separately, the seed demo
  accounts (admin@vert.com / user1@vert.com) do NOT exist in the local dev
  DB — a NextAuth credentials login attempt with them 401s even when the DB
  is up-to-spec assumptions said otherwise.
- **Cost:** Minor-moderate — a login-flow attempt, a probe-user registration
  (500), and log-reading before the root cause (DB down) was clear; then
  authenticated-route verification had to be downgraded to
  typecheck+pattern-identity evidence.
- **Cause:** Root-owned files in `~/.npm` from an old npm bug block npm's
  dynamic-subcommand install that `prisma dev` needs. Agents can't (and must
  not) sudo.
- **Workaround / fix:** Verified the fix class live on the unauthenticated
  `register` route (validation runs before any DB access). Backlogged the
  one-command user fix: `sudo chown -R 501:20 ~/.npm`.
- **Prevent next time:** Recorded in `system/environments.md`. Next agent:
  check that backlog item first; if still open, plan verification around
  unauthenticated/non-DB routes and say so in the report instead of
  burning time on login flows.

---
## 2026-07-14 — Claude Code / claude-fable-5 (2) — CORRECTION + new findings
- **Problem:** (a) CORRECTION to the entry above: the claim "seed demo
  accounts do NOT exist in the local dev DB" was WRONG — the 401s came from
  posting `email=` to NextAuth's credentials callback, which expects
  `identifier=` (`src/lib/auth.ts` authorize()). With the right field,
  user1@vert.com logs in fine and the seed accounts are present.
  (b) After the user fixed `~/.npm`, a bare `npx prisma dev` started the
  `default` server on port 51218 while the app expects 51214 — the project
  uses the **named** server `vert` (`npx prisma dev start vert --detach`),
  discoverable via `npx prisma dev ls`.
- **Cost:** Minor — one failed login round + one wrong-server start/stop
  cycle; but the wrong "no seed accounts" conclusion could have cost future
  sessions real time.
- **Cause:** Concluded "accounts missing" from a 401 without checking the
  credentials provider's expected field names; assumed `prisma dev` has one
  server per machine rather than named per-project servers.
- **Workaround / fix:** `prisma dev ls` to find the named server; grep
  `src/lib/auth.ts` before scripting a login. Both now recorded in
  `system/environments.md`.
- **Prevent next time:** A 401 from an auth endpoint is "credentials not
  accepted," not "user doesn't exist" — verify the request contract against
  the provider code before drawing data conclusions.

---
## 2026-08-01 — Buffy / deepseek-v4-flash
- **Problem:** The core-update path (`context-sync update`) is smooth, but its
  printed "next steps" hint only mentions regenerating kickoff/AGENTS — it
  doesn't mention the 0.5.0 `memory/sessions/` module adoption, the sessions.md
  `Core:`/`Notes:` field additions, or the SUMMARY.md seeding. A hurried agent
  could commit the core update and skip the memory-module side entirely.
- **Cost:** Minor — I caught it from the CHANGELOG; a few extra reads to map
  every new template/field to its memory file.
- **Cause:** The CHANGELOG is the authoritative migration doc, but the tool
  hint is terse; the 0.5.0 migration is spread across CHANGELOG + schema +
  templates.
- **Workaround / fix:** Read `core/CHANGELOG.md` fully before committing the
  update; walk the changed `core/templates/` against the live memory files.
- **Prevent next time:** Future sync sessions: after `context-sync update`,
  diff `git diff core/templates` to enumerate what must be regenerated/adopted
  (kickoff/AGENTS regeneration is called out by the tool; the sessions module
  and sessions.md entry-format fields are not).
