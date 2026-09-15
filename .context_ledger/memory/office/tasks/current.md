# Current Task (overwrite each session)

Holds exactly one task — the one being worked on right now. Set it at
session start (Step 3), clear it at session end (Step 15). If a prior
session died mid-task, check its session entry and backlog before starting.

- **Status:** working — core 1.1.3 major migration (Session 48, 2026-09-15,
  owner go-ahead: land `prisma/seed.ts` watch-history dedupe + update vendored
  core 0.8.0 → 1.1.3). Seed committed (`3978fc0`); core updated, office
  regrouped, `.context/` → `.context_ledger/` renamed; entry points
  regenerated; in-flight: memory sweep + closeout + office close + session log.
