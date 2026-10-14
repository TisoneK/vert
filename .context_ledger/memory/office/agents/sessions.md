# Agent Sessions (append-only within the current office)

One entry per agent session in the **current office**, newest at the bottom.
Never edit or delete past entries — append corrections instead. This is not
append-only *forever*: when the office reaches `office_size` sessions (or a
milestone), `ledger-history close` freezes this whole office verbatim into
`.context_ledger/history/office-<NNN>/` (roster, registry, notes, logs —
nothing trimmed), writes the permanent accomplishments record
`.context_ledger/history/office-<NNN>.md`, and opens a fresh empty office
here. Closed offices in `history/` and `archive/` are never read at session
start. Before closing, note which open threads still matter — they are
re-seeded into the new office explicitly, and nothing else carries over.

<!-- TEMPLATE — copy below the last entry and FILL IN every placeholder:
---
## YYYY-MM-DD — Session N
- **Agent:** <name> | **Model:** <model id> | **Platform:** <machine/sandbox + OS> | **Role:** <engineer, or overlay from .context_ledger/core/roles/> | **Core:** <version from .context_ledger/core/VERSION>
- **Task:** <what this session set out to do>
- **Commits:** <count> (<first-sha>..<last-sha>)
- **Outcome:** <done / partial / blocked — one line>
- **Open items:** <pointers into tasks/backlog.md, or "none">
- **Notes:** .context_ledger/memory/office/sessions/<date>-<N>/notes.md  (or "none")
- **Report:** .context_ledger/memory/office/reviews/YYYY-MM-DD-review.md
-->
---
## 2026-09-15 — Session 1
- **Agent:** ZCode | **Model:** qwen3.8-flash | **Platform:** DESKTOP-3LRR8MD (Windows 11, win32 build 26200) | **Role:** engineer | **Core:** 1.1.3
- **Task:** Owner directive (quoting the previous session's open items): land the uncommitted `prisma/seed.ts` watch-history dedupe + give the go-ahead reading for the MAJOR core update.
- **Commits:** 7 — product 1 (`3978fc0` seed dedupe, 21-video pool verified ≥ 8 draws → loop safe); ledger 6 (`de61314` core 0.8.0→1.1.3 update --major, `7c62388` office regroup (migrate), `4266a45` rename .context→.context_ledger + entry points + durable sweep, `721d262` backlog closeout (15 tombstones), office-001 close commit, this log commit).
- **Outcome:** done. Full major migration executed per CHANGELOG/MIGRATION: update --major → migrate (office architecture; source had moved to 1.1.3 mid-flight) → rename (0.18) → kickoff/AGENTS regenerated from new templates + facts refilled → active.md/gates.conf/environments swept → closeout → office closed (41 sessions frozen verbatim to history/office-001; permanent record written; open work re-seeded as B-2026-09-15-1..17 + ADR-1..31 digests). `ledger-sync verify` GREEN on Windows — the old CRLF false-fail is dead (eol=lf gitattributes + CR-stripping verify + renormalized blobs). Environment registries corrected: DESKTOP-3LRR8MD added as a distinct Windows box from Tison-Windows (owner: "two different machines"). All pushed.
- **Open items:** re-seeded backlog rows (notably B-2026-09-15-14: re-verify 1.1.3 tooling on Tison-Windows); integration gate detail below.
- **Notes:** (1) Check-in was late by protocol standards — migration began before the board existed (office only closed at session end); codename S001 claimed via this entry, no roster row signed (clock-out same turn). (2) `ledger-gates run integration` FAILED on `bun run build` — cause is environmental, not code: the user's live `next dev` server (PID tree on :3000) holds `query_engine-windows.dll.node` open so `prisma generate`'s EPERM rename fails; regeneration was redundant (schema unchanged). Verified manually: `bunx next build` + `node scripts/standalone-copy.mjs` exit 0 (all routes) before pushing. Do NOT kill the user's dev server for gates; coordinate or build the steps directly. (3) `ledger-mem check` warns legacy duplicate `Session 3/5` entries in the frozen registry — append-only history, left as-is.
- **Report:** .context_ledger/memory/office/reviews/2026-09-15-core-migration.md
---
## 2026-09-15 — Session 2
- **Agent:** Ada | **Model:** qwen3.8-flash | **Platform:** DESKTOP-3LRR8MD (Windows 11, win32 build 26200) | **Role:** engineer | **Core:** 1.1.3
- **Task:** Diagnose the Vercel production-deploy failure the owner reported (email for commit b7f8cc7) and restore deployments.
- **Commits:** 6 (6154c87..fc10962 + tag v0.9.2) — product 1 (`fc10962` next→16.3.5, release 0.9.2, DEVLOG+CHANGELOG); ledger 4 (check-in, diagnosis state, this log commit, report commit).
- **Outcome:** done. All Vercel deploys had been failing since the 2026-09-02 security sweep (13 days; production served stale 0.9.0). Root cause: the sweep's lock regeneration drifted `next` 16.2.9→16.3.4, and Next 16.3.0–16.3.4 skip emitting `.next/next-server.js.nft.json` when a Vercel adapter + `output: 'standalone'` are combined (upstream vercel/next.js#96646) — Vercel's `onBuildComplete` then dies with ENOENT. Local builds never reproduce it (no adapter locally), which is why every local check passed. Fixed by bumping next to 16.3.5 (first release carrying the backport of #97287 via #98167); verified with a Vercel preview deploy (Ready in 1m) BEFORE pushing; production deploy then confirmed green and v0.9.2 tagged/pushed.
- **Open items:** B-2026-09-15-18 (lock-drift discipline for sweeps — added this session).
- **Notes:** .context_ledger/memory/office/sessions/2026-09-15-2/notes.md
- **Report:** .context_ledger/memory/office/reviews/2026-09-15-vercel-deploy-outage.md
---
## 2026-10-14 — Session 3
- **Agent:** Noor | **Model:** claude-opus-4-8 | **Platform:** Bao's Mac (macOS, Darwin 24.6.0) | **Role:** engineer | **Core:** 2.2.0
- **Task:** Owner directive "Update ledger" — bring the ledger current: apply the pending core update surfaced by Phase 1 and do its migration.
- **Commits:** 3 ledger (`307a4ac`..this log commit) — `307a4ac` check-in; `ab56573` migrate to core 2.2.0 (core tree + routers + core.lock); this log + clock-out commit. No product code touched.
- **Outcome:** done. `ledger-sync status` reported core 2.0.1 BEHIND source 2.2.0 (same MAJOR). Ran `ledger-sync update` (2.0.1→2.2.0; `verify` GREEN against MANIFEST before and after). Regenerated AGENTS.md + CLAUDE.md from the refreshed templates — they had drifted to the trimmed 2.0.0 router form and now carry the restored weak-agent-floor rules (check-in-first, sync-first, no mixed surfaces, no leaked secrets, don't stop without pushing) plus the office-full door trigger. New in this core: `ledger-guard` (pre-commit/prepare-commit-msg/pre-push hooks, push-check, per-session identity, opt-in CI workflow), the 2.0.5 status-vs-upstream fix, 2.1.1/2.1.2 guard fixes. Project facts needed no refill (already current from the 2.0.1 migration). STATE.md regenerated at check-in and at close.
- **Open items:** (1) `ledger-guard install` NOT run — it writes three git hooks + `.claude/settings.json` and changes commit/push behavior, so it is an opt-in persistent-config change left for the owner to approve; `--ci` would also add `.github/workflows/ledger-guard.yml`. (2) Stale roster row: Ada (S002) was left on the board `Done` after session 2 clocked out in the log — left untouched (never edit a peer's row on a guess). (3) Dependabot reports 1 critical vulnerability on `main` (alert #7) — unrelated to this task, flagged for triage.
- **Notes:** Pre-commit gate's explicit check is `bun run lint`; bun is not installed on this machine (known local-dev fact) so it fails with 127 — environmental, and N/A anyway for a ledger-only change with no product code. The universal `git diff --cached --check` (whitespace) passed on every commit. Protocol order deviation, noted honestly: the Phase-1 core update was applied before the Phase-2 check-in, because the update *was* the task; check-in + both STATE regens were still pushed before the session was logged.
- **Report:** none — routine core migration, no product review performed.
