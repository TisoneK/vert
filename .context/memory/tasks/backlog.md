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
- [x] **Resolve dual lockfiles** (added 2026-07-11 by Claude Code) — both
      `bun.lock` and `package-lock.json` are committed. Two package managers'
      lockfiles drift independently and cause false-positive audit alerts /
      divergent dependency trees across machines. Pick one authoritative
      manager and delete the other lockfile. Low severity; tooling decision,
      not a code fix. Note: `bun` is not installed on Baos-Mac-mini, so npm is
      the de-facto local manager there. See 2026-07-11 review [L-1].
      **Already resolved — verified 2026-07-21 (Session 5).** This was fixed
      before it was even filed: commit `aab2c89` (2026-07-08) removed the
      tracked `package-lock.json` and added it to `.gitignore` (with a comment
      naming `bun.lock` authoritative), plus the Dependabot config. Current
      state: `git ls-files` tracks **only `bun.lock`**; `package-lock.json` is
      gitignored, so the copy on Baos-Mac-mini is an untracked npm artifact
      that never reaches the repo — harmless, no drift, nothing to delete. The
      2026-07-11/pasted-review flag was a false positive (saw both files on
      disk without checking git tracking). No action needed.
- [x] **Route `seed`/`cleanup-demo` through the shared `db` singleton** (added
      2026-07-11 by Claude Code) — `src/app/api/seed/route.ts` and
      `src/app/api/cleanup-demo/route.ts` instantiate `new PrismaClient()`
      directly instead of the lazy pooled singleton in `src/lib/db.ts`,
      bypassing the serverless pool params. Acceptable for one-off ops
      endpoints but worth aligning. Low severity. See review [L-2].
      **Done 2026-07-14** by Claude Code / claude-fable-5, commit `59f23da`
      (Session 3) — both routes now import the shared `db` singleton;
      `$disconnect()` blocks removed.
- [ ] **Add a test suite + CI** (added 2026-07-11 by Claude Code) — no test
      runner configured (documented in ARCHITECTURE.md §4). Recommended:
      Vitest (unit) + Playwright (E2E), plus a GitHub Actions workflow running
      typecheck + lint + build on PRs. When tests land, backfill a regression
      test for the 400-on-malformed-body fix (commit b21a094). See review [L-3].
      _2026-07-14 addendum:_ also backfill regression tests for the
      non-string-body-field 400 fix (commit `a27d338`, review 2026-07-14 [M-2]).
      **CI half done 2026-07-21** by Claude Code / claude-opus-4-8, commit
      `4a35892` (Session 5) — `.github/workflows/ci.yml` runs `tsc --noEmit` +
      `next build` (hard) and `eslint .` (advisory) on PRs into `main`. Still
      open: (a) the **test runner + tests** (Vitest/Playwright) — the larger
      part of this item; (b) **GitHub Actions is billing-locked** so no run has
      gone green yet (user must unlock billing); (c) **enable branch protection
      on `main`** with the `typecheck · build` check required, or the gate only
      reports and doesn't block merges (user, repo setting); (d) flip the eslint
      step from advisory to blocking once the 35-error baseline is cleared.
- [x] **Fix `~/.npm` ownership so `npx prisma dev` works on Baos-Mac-mini**
      (added 2026-07-14 by Claude Code) — npm's dynamic-subcommand install hits
      EACCES on root-owned files in `~/.npm/_cacache`, so the local Prisma dev
      DB (port 51214) cannot start and no DB-touching flow can be tested
      locally. **User action, one command:** `sudo chown -R 501:20 "/Users/bao/.npm"`
      (npm's own suggested fix — agents must not run sudo). Until then,
      functional testing of authenticated endpoints is blocked on this machine.
      See review 2026-07-14 §5.
      **Done 2026-07-14** — user ran the chown same day; `prisma dev` verified
      working (named server `vert` on port 51214 — see
      `system/environments.md` for the exact start command). Full
      authenticated-route verification of a27d338 then completed; see the
      2026-07-14 review addendum.

---
- [ ] **Migrate fetch-in-effect components to react-query (clears the 33
      remaining eslint errors)** (added 2026-07-21 by Claude Code) — ~20
      components in `src/components/vert/` use the
      `useEffect(() => fetchX(), [])` + `setState` pattern, which trips the
      React-Compiler rules `react-hooks/immutability` (22) and
      `react-hooks/set-state-in-effect` (11 remaining). Per **ADR-2**, these
      two rule classes are coupled — `useCallback`/reordering only trades one
      for the other, so do NOT attempt a mechanical burndown. The real fix is
      `@tanstack/react-query` (already a dependency): replace each fetch
      effect with `useQuery`. Architectural — owner approval obtained
      2026-07-21 to DEFER (chose "safe subset now"). Do incrementally with
      per-component verification (loading/refetch behavior, caching). When it
      lands, flip the CI lint step (`.github/workflows/ci.yml`, "Lint
      (advisory)") from `continue-on-error: true` to blocking.
      _Safe subset already done 2026-07-21, commit `67f1009`:_ `use-mobile.ts`
      → `useSyncExternalStore`; `sidebar.tsx` skeleton → hashed `useId()`
      (baseline 35 → 33). Remaining files (all fetch-in-effect): CategoryPage,
      ChangelogPage, ChannelPage, CreatorStudio, ExplorePage, HistoryPage,
      HomeFeed, NotificationCenter, PlaylistDetailPage, PlaylistPicker,
      ProfilePage, RelatedVideos, SavedPage, SearchResults, TagPage,
      TrendingPage, UploadPage, VideoDetail, VideoPlayer, carousel.tsx.
