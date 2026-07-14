# Environments (update in place)

Machines and sandboxes agents have run on, and what it takes to work on
this project from each. One block per environment; update the matching
block (and its "last verified" date) every time you run on it again.

## Rules

1. **Match before you add.** At session start, check whether the machine
   you're on already has a block (use its "Identify by" line). Update the
   match; add a new block only for a genuinely new environment.
2. **Record what you verified, not what you assume.** A command belongs
   under "Verified commands" only after it ran successfully on this
   environment, this project.
3. **Agents never delete blocks.** An environment the project no longer
   uses may be pruned by the user; if you can't verify a block, leave it
   alone — its last-verified date already says how stale it is.
4. **Machine facts only.** Secret values go in `secrets/`; user
   preferences in `user/`; project-wide decisions in `plans/`.

<!-- TEMPLATE — one block per environment:
---
## <stable label — hostname, "Z sandbox", "GitHub Actions ubuntu-24.04"> (last verified YYYY-MM-DD)
- **Identify by:** <how an agent recognizes this env — hostname, $USER, workspace path>
- **OS:** <e.g., macOS 15.5 / Ubuntu 24.04 sandbox>
- **Runtimes:** <node X, python Y, ...>
- **Package manager:** <npm/bun/pnpm/pip/...>
- **Verified commands:** <install / test / lint / typecheck / dev-server commands that actually worked here, with cwd if it matters>
- **Quirks:** <e.g., "no psql installed", "port 3000 usually taken", "system Python locked down">
-->

---
## Baos-Mac-mini (last verified 2026-07-14)
- **Identify by:** hostname `Baos-Mac-mini.local`, `$USER=bao`, workspace `/Users/bao/Code/vert`
- **OS:** macOS 15.7.7 (Darwin 24.6.0, build 24G720)
- **Runtimes:** node v24.17.0, npm 11.13.0
- **Package manager:** npm (`package-lock.json` present). NOTE: repo also ships a `bun.lock` and several `package.json` scripts call `bun` (`start`, `db:seed`), but **bun is not installed on this machine** — use npm for install and the `next dev` dev server; bun-only scripts won't run here.
- **Verified commands:** `npm run dev` (Next.js dev server on :3000, tees to dev.log); `npx eslint .` (lint); `npx tsc --noEmit` (typecheck — to verify). `node_modules/` already installed.
- **Quirks:** no bun installed; no psql installed (Prisma dev DB used for local development, connection uses `pgbouncer=true`). Dev server writes `dev.log`; `start`/`build` scripts assume a bun standalone runtime not available here. `npx eslint .` reports 35 pre-existing errors + 32 warnings (all in `src/components/vert/`, `components/ui/`, `hooks/`, `lib/` — react-hooks compiler rules on old patterns); typecheck is clean. Gate on "no NEW errors," not zero. IMPORTANT: this machine's background-shell capture truncated a full `eslint .` run once this session and reported a false "clean" — always confirm the printed problem summary line, don't trust exit-only captures. `npx prisma dev` FAILS here (verified 2026-07-14): npm's dynamic-subcommand install hits EACCES on root-owned files in `~/.npm/_cacache` — user must run `sudo chown -R 501:20 ~/.npm` to fix; until then the local dev DB (DATABASE_URL → localhost:51214) can't start and login/seed/authenticated-endpoint testing is impossible. The dev server itself runs fine (unauthenticated, non-DB routes testable). Seed demo accounts (admin@vert.com etc.) are NOT present in the local dev DB.