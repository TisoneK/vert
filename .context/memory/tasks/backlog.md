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
- [x] **Migrate fetch-in-effect components to react-query (clears the 33
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
      **DONE 2026-07-22 (Session 6)** — owner reversed the defer ("refactor
      it"); full migration landed across commits `27ac41a`..`cf87a8c`. Wired
      `QueryClientProvider` (`src/app/providers.tsx`, was never mounted despite
      the dep). All list/paginated reads → `useQuery`/`useInfiniteQuery`;
      mutations (History/Saved/Playlist/Notifications/VideoDetail-save) write
      through `setQueryData`; Notifications polling → `refetchInterval`. The
      two non-fetch external-syncs (carousel init, VideoPlayer HLS) got
      documented `eslint-disable`s. **eslint 35 → 0 errors**; tsc + `next
      build` clean; runtime-verified explore/trending(filter)/category(sort)/
      tag/home/watch. CI lint step flipped to **blocking** (`c4929d9`). Follow-
      up (not blocking): shared query-key/hook factory to dedupe the inline
      `['categories']` etc. queryFns; consider react-query for the remaining
      one-off `fetch` calls in mutation handlers.

---
- [x] **Feature: Lazy Loading** (added 2026-08-04 by Claude Code) — the SECOND of
      the two features the user requested ("Add features; Pre-fetch and Lazy
      Loading each in a separate session"). Pre-fetch shipped in Session 8
      (`42acc99`); Lazy Loading is its own session. Scope to define at kickoff, but
      the likely surfaces in this codebase: (a) **images** — `VideoCard`,
      `RelatedVideos`, `LandingPage`, and channel/avatar `<img>` tags are plain
      `<img>` with eager loading; add `loading="lazy"` + `decoding="async"` (or
      migrate to `next/image`), and/or an IntersectionObserver so off-screen
      thumbnails don't all fetch at once. (b) **feed pagination** — several feeds
      use `useInfiniteQuery` (CategoryPage/TagPage) but load more via a button or
      full list; an IntersectionObserver "load next page when the sentinel scrolls
      into view" (infinite scroll) is the natural lazy-load counterpart to
      Session 8's prefetch. (c) **route/component code-splitting** — heavy
      client components (e.g. `@mdxeditor/editor` in CreatorStudio, the HLS
      `VideoPlayer`) could `React.lazy`/`next/dynamic` to shrink the initial
      bundle. Use the feature-engineer role (design ADR first). Runtime-verify in
      the browser pane (note: coordinate-clicks are flaky here — use programmatic
      `.click()`; see `system/environments.md`).
      **DONE 2026-08-04 (Session 9)** — user chose interpretation **(a) lazy-load
      images**. Shipped `loading="lazy"` + `decoding="async"` on the 12 list/grid
      `<img>` sites; hero/LCP images left eager on purpose (**ADR-4**). Commit
      `5a564d5`, pushed. Verified render-level (attributes present in live DOM);
      eslint 0 errors, tsc clean. Interpretations **(b) infinite scroll** and
      **(c) code-splitting** were NOT done — see the two new backlog items below
      if either is wanted as its own session.
- [ ] **Feature: Infinite scroll (feed pagination)** (added 2026-08-04 by Claude
      Code) — interpretation (b) of "Lazy Loading", deferred when the user scoped
      Session 9 to images. Feeds like HomeFeed load a fixed `limit=24` batch in one
      query and stop; CategoryPage/TagPage use `useInfiniteQuery` but load more via
      a button. Add an IntersectionObserver sentinel that calls `fetchNextPage()`
      when it scrolls into view (there's a precedent IO in `ChangelogPage.tsx:33`).
      Feature-engineer role; design ADR first.
- [ ] **Feature: Code-split heavy client components** (added 2026-08-04 by Claude
      Code) — interpretation (c) of "Lazy Loading". `next/dynamic`/`React.lazy` for
      heavy client components — the `@mdxeditor/editor` in CreatorStudio and the HLS
      `VideoPlayer` are the prime candidates — to shrink the initial JS bundle.
      Mostly-invisible perf win; verify bundle size before/after. Feature-engineer
      role; design ADR first.
- [ ] **Consider a shared `<LazyImage>`/`<Thumbnail>` component** (added 2026-08-04
      by Claude Code) — follow-up from ADR-4. There are ~20 `<img>` sites repeating
      the same `loading`/`decoding` attrs plus per-component `onError` fallback
      state (`thumbnailFailed`/`avatarFailed` in VideoCard, etc.). A shared image
      component would DRY this up and make "new image → correct defaults"
      automatic. Deferred from Session 9 as scope creep. Low priority; a refactor,
      not a feature.
- [ ] **Prefetch on keyboard focus** (added 2026-08-04 by Claude Code) — the
      Session-8 pre-fetch fires on `onMouseEnter`/`onTouchStart` but NOT `onFocus`,
      because `VideoCard`'s root is a non-focusable `<div onClick>` (existing
      pattern across the app). If cards ever gain `tabIndex`/`role="button"` for
      accessibility, add `onFocus={() => prefetchVideo(id)}` alongside the existing
      handlers in `VideoCard.tsx`, `RelatedVideos.tsx`, `LandingPage.tsx` so
      keyboard users get the same head start. Low priority; coupled to the larger
      a11y question of making cards proper buttons.
- [ ] **Slow video load on the live site (Session 10 diagnosis)** (added 2026-08-04
      by Claude Code) — the biggest cold-load cost is raw video files: uploads are
      served as **progressive-download** `.mp4`/`.mov` (a real one is **20MB**;
      `VideoPlayer` only uses hls.js for `.m3u8`, everything else is a native
      `<video>` full-file download), and the `<video>` in `VideoPlayer.tsx:591` has
      **no `preload`** attr. Quick win: add `preload="metadata"` so the watch page
      doesn't pull the whole file before Play. Bigger: transcode uploads to
      web-friendly H.264 MP4 + HLS (adaptive streaming) and convert-or-reject `.mov`.
      Live blob host `7omh3o8afcek9nbu.public.blob.vercel-storage.com`; live URL
      https://vert-wine.vercel.app.
- [x] **Slow video load — progressive preload mitigation** (added 2026-08-04;
      completed Session 12, commit `879510e`) — `VideoPlayer` now uses
      `preload="metadata"` and `playsInline`, asking browsers to fetch only
      metadata before playback for raw progressive uploads. `preload` is a hint,
      not a guarantee, and does not control the hls.js path. The original live
      diagnosis remains: raw `.mp4`/`.mov` delivery (one real file was **20MB**)
      is still not compressed or adaptive-streamed.
- [ ] **Slow video load — transcode and delivery architecture** (follow-up from
      Session 10/12) — add a processing pipeline that produces web-friendly H.264
      MP4 and HLS/adaptive renditions, and decide whether to convert/reject `.mov`.
      Vercel Blob is direct-upload object storage, not a native transcoder; choose
      a dedicated video platform or separately operated processing worker before
      implementing. This requires a service decision, credentials, lifecycle
      handling, and a migration plan for existing blobs. Live blob host
      `7omh3o8afcek9nbu.public.blob.vercel-storage.com`; live URL
      https://vert-wine.vercel.app.
- [ ] **Optimize the remaining images with next/image** (added 2026-08-04 by Claude
      Code) — Session 11 (ADR-5) migrated the high-impact THUMBNAILS to `next/image`
      but deliberately left these as plain `<img>`: **avatars** (VideoCard:~294,
      HomeFeed creator shelf, ChannelPage header, VideoDetail, CommentSection,
      Sidebar, SearchResults, ProfilePage — KB-range, lower impact), the
      **VideoPlayer poster** (`VideoPlayer.tsx:538`, inside the player's canvas
      frame-capture logic — migrate carefully), and **channel/profile banners**
      (`ChannelPage.tsx:93`, `ProfilePage.tsx:160`). Same `<Image fill sizes>` /
      `width`+`height` pattern; keep each `onError` fallback.
- [ ] **Upload-time image compression (complementary to next/image)** (added
      2026-08-04 by Claude Code) — `sharp` is installed but uploads go **browser →
      Vercel Blob directly** (`api/v1/upload` only mints a client token; no server
      hook to compress on upload). To shrink STORED bytes for new uploads, add a
      post-upload processing step (a blob webhook / separate function that fetches,
      compresses via sharp, re-stores). next/image (ADR-5) already handles delivery,
      so this is a storage/origin-bytes optimization, not urgent.
- [ ] **Shared `<OptimizedImage>` component** (added 2026-08-04 by Claude Code) —
      supersedes the ADR-4 `<LazyImage>` idea. Wrap `next/image` + the repeated
      null-src/`onError` fallback into one component so new content images get
      optimization + fallback for free. Deferred from Session 11 as scope creep. A
      refactor, not a feature.
