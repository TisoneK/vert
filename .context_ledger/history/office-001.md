# Office 001 — accomplishments record (permanent)

- Opened: 2026-07-11
- Closed: 2026-09-15
- Sessions: 41

The frozen office lives at history/office-001/ until it is zipped into
archive/office-001.tar.gz. This record stays in history/ forever — even after
the tarball is garbage-collected, the office is never forgotten. Not read at
session start; deliberate lookback only.

## Accomplished

- Built **Vert** (https://vert-wine.vercel.app/) from a blank repo into a
  production-deployed vertical-video platform: Next.js 16 + Prisma/Postgres +
  NextAuth; auth, channels, direct-to-Vercel-Blob uploads, feeds, search,
  tags/categories, comments/votes/playlists/saved/history, notifications,
  admin tooling, legal pages, sitemap/robots.
- Releases **0.1.x → 0.9.1** (git tags v0.6.x–v0.9.1; push to `main` =
  production deploy — ADR-7).
- Code-quality arc: fetch-in-effect → `@tanstack/react-query` migration
  (ESLint 35 errors → 0, CI lint made blocking); per-route SEO/share metadata
  (ADR-25); real anchor cards (ADR-26); honest contact form (ADR-27);
  password policy (ADR + blocklist, 0.7.3); theme-complete 404/500 (ADR-29);
  conservative CSP; thumbnail skeletons (ADR-30); ad-slot gating;
  Terms/Privacy pages; watch-page playback — autoplay, auto-advance,
  loop-if-last, persistent volume (ADR-31, 0.9.0).
- Security: dependency sweep release 0.9.1 (`bun audit` 30 vulns incl. a
  next-auth critical → 8, all unpatched-upstream or dev-only), dependabot
  high alert closed; POSIX-only build step replaced with cross-platform
  `scripts/standalone-copy.mjs` (Windows builds work).
- Infra/process: GitHub Actions CI (tsc + build hard, lint blocking), branch
  protection on `main` (force-push + deletion blocked, admin enforcement —
  direct-push workflow preserved), Windows GitHub-API-via-GCM pattern
  recorded in environments.
- Protocol: ran this repo's context workflow from bootstrap through core
  0.1.0 → 0.8.0, and closed by executing the **0.8.0 → 1.1.3 major
  migration** — flat memory → office architecture, `.context/` →
  `.context_ledger/`, entry points regenerated, CRLF verify false-fail
  eliminated. This office (41 sessions, 31 ADRs, 20+ review reports) was
  then frozen here; open work re-seeded into the fresh office.

## Decisions still in force

- **ADR-1 through ADR-31** — digested into the new office's
  `plans/decisions.md` (full texts live in the frozen copy / git history).
  Load-bearing for day-to-day work: ADR-7 (push to main = production
  release), ADR-2 (react-query for data fetching — never re-introduce
  fetch-in-effect), ADR-26 (content cards are real anchors), ADR-27 (no
  faked contact success), ADR-28 (rate limiting must move to a shared store
  — implementation still pending), ADR-30/31 (thumbnail + playback rules).

## Open threads

- Re-seeded into the new office's `tasks/backlog.md` as `B-2026-09-15-1`
  through `-17`: content/seed-data realism (owner), test runner + tests,
  video transcode/delivery architecture, rate-limit shared store, password
  reset + provider-blocked security items, design-decision polish batch
  (L2/L6/L8/L9/L11, P2 void, P4/P5 hero, P6 404), infinite scroll,
  code-splitting, dependency-advisory watch, shared image component,
  upload-time compression, poster migration, and environment re-verifies
  after the 1.1.3 migration.
- Not carried (done or dead): react-query burndown, review items H1/M1/M4/
  L1/L5/L12/L13/P1/P3/C1, prefetch-on-focus, L3/L4/L10 (already-handled
  false positives), the 0.8.x CRLF verify flaw (fixed by the 1.1.3
  migration; only a re-verify-on-Tison-Windows stub remains).
