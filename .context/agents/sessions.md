# Agent Sessions (append-only)

One entry per agent session, newest at the bottom. Never edit or delete
past entries — append corrections instead.

<!-- TEMPLATE — copy below the last entry:
---
## YYYY-MM-DD — Session N
- **Agent:** <name> | **Model:** <model id> | **Platform:** <machine/sandbox + OS> | **Role:** <engineer, or overlay from the protocol package's roles/>
- **Task:** <what this session set out to do>
- **Commits:** <count> (<first-sha>..<last-sha>)
- **Outcome:** <done / partial / blocked — one line>
- **Open items:** <pointers into tasks/backlog.md, or "none">
- **Report:** .context/reviews/YYYY-MM-DD-review.md
-->

---
## 2026-07-11 — Session 1
- **Agent:** Claude Code | **Model:** claude-opus-4-8 | **Platform:** Baos-Mac-mini (macOS 15.7.7) | **Role:** engineer
- **Task:** Bootstrap `.context/` from the TisoneK/.context skeleton; general-sweep review of the Vert codebase (discovery + review + fix safe issues)
- **Commits:** 3 — `5652a44` (bootstrap .context/), `b21a094` (fix(api): 400 on malformed body, 17 routes), + this context/report commit
- **Outcome:** done — typecheck clean; ESLint has 35 pre-existing errors (all in components/vert, ui, hooks, lib — none in API code; gate = no new errors). 1 Medium fixed & pushed (changed files error-clean); 3 low items backlogged. No Critical/High findings.
- **Open items:** tasks/backlog.md — dual lockfiles, seed/cleanup Prisma singleton, test suite + CI
- **Report:** .context/reviews/2026-07-11-review.md
---
## 2026-07-14 — Session 2
- **Agent:** Claude Code | **Model:** claude-fable-5 | **Platform:** Baos-Mac-mini (macOS 15.7.7) | **Role:** engineer (memory mode — .context/ maintenance only)
- **Task:** Context sync: pull package (f1c73e5), sync structural files (README.md, SYNC.md now document kickoff.md); backfill `.context/kickoff.md` from the package skeleton template (facts verified: project repo Public, package repo Private, default branch main); correct `workflows/active.md` Protocol field to "by agent type" per package fix f1c73e5.
- **Commits:** 3 — structure sync, kickoff backfill, active.md protocol correction (this commit)
- **Outcome:** done — no project-surface changes this session
- **Open items:** none new (backlog unchanged)
- **Report:** none — maintenance session, no review performed
---
## 2026-07-14 — Session 3
- **Agent:** Claude Code | **Model:** claude-fable-5 | **Platform:** Baos-Mac-mini (macOS 15.7.7) | **Role:** engineer
- **Task:** General sweep (standing Target): verified Session 1 baseline (typecheck 0, eslint 35+32 pre-existing, npm audit 0 vulns); fixed [M-2] non-string body fields → 500 in 5 routes; closed backlog [L-2] (seed/cleanup via shared db singleton)
- **Commits:** 4 (a27d338..this) — fix(api) a27d338, refactor(db) 59f23da, docs(review) 7125bf3, + this context commit
- **Outcome:** done — register fix verified live (400, was 500); authenticated-route runtime testing blocked (local prisma dev DB can't start: ~/.npm EACCES, user action needed)
- **Open items:** tasks/backlog.md — dual lockfiles [L-1], tests+CI [L-3] (+ a27d338 regression addendum), NEW: ~/.npm chown fix (user, one command)
- **Report:** .context/reviews/2026-07-14-review.md
