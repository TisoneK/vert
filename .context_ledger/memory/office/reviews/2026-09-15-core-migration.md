# Report — 2026-09-15 — Core 0.8.0 → 1.1.3 major migration + seed dedupe

**Directive:** owner said "Start" on the two items left open by the
previous session — (1) the uncommitted `prisma/seed.ts` watch-history
change, (2) go-ahead for the MAJOR vendored-core update.

## Seed change (product)

- `3978fc0 fix(seed): sample 8 distinct videos for user1 watch history`.
- Reviewed before landing: the dedupe `do...while` terminates because the
  seed pool is 21 videos (4+3+5+3+6 across 5 channels) ≥ the 8 draws. No
  version bump/tag — seed-data behavior only, not a deployed-runtime
  change (ADR-1 logic).

## Core migration (ledger)

0.8.0 → 1.1.3 crossed **two** breaking boundaries, per the upstream
CHANGELOG (0.18.0 rename was a deliberate breaking MINOR):

1. `ledger-sync update --major` (still named `context-sync` then) —
   vendored core replaced; `verify` now ships in a form that strips CR
   before hashing.
2. `ledger-sync migrate --major` — **office architecture**: flat
   `memory/{agents,tasks,plans,flaws,inefficiencies,reviews,sessions}`
   regrouped into `memory/office/`; durable files (workflows, system,
   user, overrides, secrets, core.lock) stayed at the memory root;
   `history/` + `archive/` zones backfilled; `history.conf` created;
   `.context/.gitattributes` (`eol=lf`) + root `CLAUDE.md` installed.
   The update source had meanwhile released **1.1.3**, so that's where we
   landed.
3. `ledger-sync rename` — `git mv .context → .context_ledger`; all
   `context-*` tools are now `ledger-*` (+ `.cmd` launchers); schemas →
   `ledger-schema.md` / `ledger.schema.json`.
4. Entry points regenerated from the 1.1.3 templates and **refilled with
   verified facts**: `kickoff.md` (incl. branch-protection note on the
   default branch; upstream package URL → `TisoneK/context-ledger.git`),
   root `AGENTS.md` (office + check-in-at-the-door rules), durable memory
   swept (`active.md` → office paths + `chore(ledger):` prefix + Gates
   row; `gates.conf` header; `environments.md` old tool paths).
5. `ledger-mem closeout --confirm` — 15 finished checkbox tombstones
   deleted from the backlog (legacy format).
6. **Office close** (41 live sessions > `office_size` 20 — full at the
   door): `ledger-history close --confirm` froze `memory/office` verbatim
   into `history/office-001/`, wrote the permanent record
   `history/office-001.md` (Accomplished / Decisions in force / Open
   threads), and opened fresh skeletons. Open work re-seeded into the new
   office: backlog `B-2026-09-15-1..17` (priority tables) and
   ADR-1..31 digests (IDs stable, next ADR = 32). Re-seeded entries carry
   no old session numbers.
7. `ledger-mem check`: registries clean (dup-key none; two legacy
   duplicate-Session warnings live in the *frozen* registry — append-only
   history, untouched). `ledger-sync verify`: **GREEN** — the Windows
   CRLF false-fail (open flaw from the old office) is resolved by the
   shipped `eol=lf` gitattributes + CR-stripping verification + LF
   renormalization of memory blobs.

## Build / gate outcome (honest)

- `ledger-gates run integration` (**bun run build**) FAILED: `prisma
  generate` cannot swap `query_engine-windows.dll.node` while the owner's
  live `next dev` (port 3000) holds it (EPERM). Redundant regen (schema
  unchanged) — did NOT kill the owner's server. Verified equivalently by
  hand: `bunx next build` (all routes, clean) + `scripts/standalone-copy.mjs`
  → both exit 0, then pushed.
- Pre-commit gate (`bun run lint`) passed at every commit (3-warning
  baseline).
- **New environment fact:** this machine is `DESKTOP-3LRR8MD`
  (user `Lameck`, `C:\Users\Lameck\Tisone\vert`) — the owner confirmed it
  is a **different** Windows machine from `Tison-Windows`. Both entries
  now exist separately in `environments.md`; Tison-Windows's CRLF quirk
  entry carries a re-verify note (backlog B-2026-09-15-14).

## Pushed

`3978fc0`, `de61314`, `7c62388`, `4266a45`, `721d262` + this office-close
and session-log commits — direct to `main` (branch protection unaffected
for normal pushes). Vercel will redeploy the seed-only product change
harmlessly.
