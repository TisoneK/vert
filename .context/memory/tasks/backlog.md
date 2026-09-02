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
- [x] **Prefetch on keyboard focus** — DONE 2026-08-11 (Session 35, commit `45eccc2`): VideoCard's
      title is now a focusable `<a>` with `onFocus={() => prefetchVideo(id)}`. (added 2026-08-04 by Claude Code) — the
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

---
- **2026-08-07 completion note:** Session 21 completed safe avatar and
  channel/profile banner optimization (host-safe optimizer routing plus
  URL-keyed fallbacks), released in `v0.6.15`. The VideoPlayer poster remains
  intentionally native because it is adjacent to canvas frame capture.

---
_Appended 2026-08-11 (Session 33, research sweep — review 2026-08-11-review.md, ADR-25…29)._

- [x] **[H1] Per-route share + SEO metadata (generateMetadata) + sitemap/robots** — DONE
      2026-08-11 (Session 34), `0.7.0`, commit `4e63b6d`, tag `v0.7.0`. ADR-25 shipped.
      (added 2026-08-11 by Claude Code) — content routes (`watch/[id]`, `channel/[id]`,
      `category/[slug]`, `tag/[slug]`) are thin `'use client'` shells with no `generateMetadata`;
      the only metadata is global in `src/app/layout.tsx`. Prod `/watch/<id>` returns
      `<title>Vert</title>`, no `og:image`/`og:video`, `twitter:card=summary`, and the video
      title is absent from server HTML → blank social cards + no SEO. Add async
      `generateMetadata` per content route (direct `db` lookup → title/description/og:image=
      thumbnail/og:video/`summary_large_image`), plus `app/sitemap.ts` + `app/robots.ts`
      (supersede static `public/robots.txt`). **Design = ADR-25 (proposed — needs owner OK).**
      Highest-leverage fix for the "share" value prop.
- [x] **[M1] Content cards as real anchors, not `div onClick`** — DONE 2026-08-11 (Session 35),
      `0.7.1`, commit `45eccc2`, tag `v0.7.1`. ADR-26 shipped; live-verified (6 watch anchors +
      5 tag anchors on the landing page). Also closed the prefetch-on-focus follow-up.
      (added 2026-08-11 by Claude
      Code) — `VideoCard.tsx:100` root is `<div cursor-pointer onClick>`; 0 `<a>` on content
      pages → not crawlable, not keyboard-focusable, no open-in-new-tab/copy-link; nested
      `<button>`s inside the click div (a11y anti-pattern). Make the primary target
      `<a href={viewToPath(...)} onClick={e=>{e.preventDefault();navigate(...)}}>` (keeps zustand
      nav, lets modified-clicks fall through). Same for `RelatedVideos` + `LandingPage` cards.
      Unblocks the "prefetch on keyboard focus" item. **Design = ADR-26 (proposed).**
- [x] **[H2] Contact form fakes success** — DONE 2026-08-11 (Session 36), `0.7.2`, commit
      `8183ed9`, tag `v0.7.2`. ADR-27 shipped: real `POST /api/v1/contact` (validate + rate-limit
      + server-log capture + optional `CONTACT_WEBHOOK_URL` forward); UI shows success only on
      2xx; truthful copy. Live-verified (400/400/200). Follow-up when email infra lands: upgrade
      log-capture → email delivery (webhook hook already present).
      (added 2026-08-11 by Claude Code) —
      `ContactPage.tsx` handleSubmit `setTimeout(800)` → "Message sent, we'll get back to you by
      email" but sends nothing (TODO in code). Either add real `POST /api/v1/contact`
      (persist/forward) or replace with honest copy; never show delivered-success for a no-op.
      **Design = ADR-27 (accepted).** Shares the email-provider dependency with password reset.
- [ ] **[M2] Rate limiting is per-instance in-memory (ineffective on serverless)** (added
      2026-08-11 by Claude Code) — `src/lib/rate-limit.ts` module-level `Map`; assumes
      single-instance but prod is Vercel serverless (multi-instance + cold starts) so
      login/signup throttles reset per instance. Move store to Vercel KV / Upstash behind the
      same `rateLimit()` interface (atomic INCR+TTL); keep in-memory as local-dev fallback.
      **Design = ADR-28 (proposed — needs KV/creds).**
- [ ] **[M3] Password reset / "Forgot password?" flow** (added 2026-08-11 by Claude Code) —
      LoginForm has no reset link; no reset route exists (only authenticated
      `/api/v1/auth/change-password`). Email/password users who forget are locked out. Needs an
      email provider (the long-standing user-action blocker). Build: request-reset route
      (rate-limited, token emailed) + reset-confirm route + LoginForm link.
- [x] **[M4] Strengthen password policy** — DONE 2026-08-11 (Session 37), `0.7.3`, commit
      `0d2083b`, tag `v0.7.3`. Min raised 6→8 (client+server+copy) + a no-dependency
      common-password blocklist server-side. Live-verified (400 for 6-char + for "password123").
      Follow-up (still open): a real breach-corpus (HaveIBeenPwned k-anonymity) check.
      (added 2026-08-11 by Claude Code) — min is 6 chars
      (`SignupForm.tsx:34` + `register/route.ts:66`), no strength/breach check. Raise to 8+ and
      consider a common-password/breach check. Update both client + server + the placeholder copy.
- [x] **[L1] Theme-aware 404/500 pages** — DONE 2026-08-11 (Session 38), `0.7.4`, commit
      `57635df`, tag `v0.7.4`. ADR-29 shipped; live-verified (`dark:bg-zinc-950` in served HTML).
      (added 2026-08-11 by Claude Code) — `not-found.tsx` +
      `error.tsx` hard-code `bg-white`/`text-zinc-900`, no `dark:` → white page in dark mode.
      Use theme-aware tokens. **Design = ADR-29 (accepted).** Safe one-file-each fix.
- [~] **[L2–L13] Polish batch from the 2026-08-11 review** — PARTIALLY DONE 2026-08-11
      (Session 39), `0.7.5`, commit `7533cb9`, tag `v0.7.5`. **Shipped:** L5 (search now matches
      tag/category names — live-verified "music" returns results), L12 (upload no longer leaks
      raw error `details`), L13 (conservative CSP header — live-verified non-breaking: images +
      video + anchors all load, no violations). **Already-handled / not a bug:** L3 (Trending
      chips are `shrink-0` in an `overflow-x-auto` fade scroller), L4 (ExplorePage already splits
      full-color vs muted "More categories"), L10 (ad slot is a deliberate provider-neutral slot,
      ADR-15/22). **Deferred → see the new item below.** (added 2026-08-11 by Claude Code) —

      independent low-severity items, each small: **L2** Trending #1 hero wastes desktop
      horizontal space (portrait thumb in a wide gray box); **L3** Trending category chips clip
      "Travel"; **L4** empty categories (Art/Comedy/Food/Music/News/Other/Travel) shown as equal
      filters resolve to "No videos yet" — hide/grey until populated; **L5** search matches
      titles only ("music" → no results despite `music` tag/Music category) — index
      tags/categories/channel names; **L6** thumbnails flash gray (add `next/image`
      `placeholder="blur"`); **L7** `twitter:card=summary` → `summary_large_image` (folds into
      ADR-25); **L8** header inconsistency (landing has no search bar, app does); **L9** crowded
      mobile header at 375px; **L10** "ADVERTISEMENT — Reserved placement" visible on public
      watch pages reads unfinished; **L11** ~97 `console.*` in `src/` — audit for detail leaks;
      **L12** `upload/route.ts:105` returns raw `details:errorMsg` on token-gen failure; **L13**
      no Content-Security-Policy header (X-Frame-Options + HSTS are set). See review for detail.
- [ ] **Deferred polish from the 2026-08-11 review (design/infra judgment)** (added 2026-08-11
      by Claude Code, Session 39) — the subset of [L2–L13] intentionally NOT auto-implemented,
      each needing a design decision or infra, not a safe mechanical fix: **L2** Trending #1 hero
      wastes desktop horizontal space (a single portrait thumb in a wide box) — needs a layout
      design pass; **L6** thumbnail gray-flash → `next/image` `placeholder="blur"` needs a
      generated `blurDataURL` per remote image (no pipeline yet); **L8** header inconsistency
      (logged-out landing has no search bar, in-app header does) — nav design decision; **L9**
      crowded mobile header at 375px — design decision; **L11** ~97 `console.*` in `src/` — a
      considered audit (keep legit error logs, drop noise), low value. Pick up individually if
      desired.
- [ ] **Infra-blocked review items (need owner-provided services)** (added 2026-08-11 by Claude
      Code, Session 37/39) — **[M2]** move the rate limiter off per-instance in-memory to Vercel
      KV / Upstash (ADR-28, needs KV creds); **[M3]** password-reset flow (needs an email
      provider); **contact email delivery** — upgrade the `/api/v1/contact` log-capture to real
      email once a provider exists (webhook hook already in place); a **breach-corpus
      (HaveIBeenPwned) password check** to complement the min-8 + common-password blocklist.

---
_Appended 2026-08-11 (Session 40, production-feel research — see
`reviews/2026-08-11-production-feel-review.md`)._

- [x] **[P1] Thumbnail placeholder to kill the flash-of-empty-gray** — DONE 2026-08-11 (Session
      41), shipped `0.7.6`→`0.7.8` (final `0.7.8`, commit `8e33f6c`, tag `v0.7.8`). Shared
      `<ThumbnailImage>` + VideoCard inline: pulsing skeleton underlay behind an always-visible
      image (ADR-30 — never opacity-hide the image). Vercel cloud build + deploy confirmed (local
      build blocked by machine memory pressure). Also partially closes the shared-`<Thumbnail>`
      refactor note.
      (added 2026-08-11 by Claude
      Code) — `next/image` thumbnails have no skeleton/blur, so cards render as blank gray boxes
      until decode; on the **mobile home the whole above-the-fold is empty gray** on load.
      Add a shimmer/skeleton over the image container (VideoCard/LandingPage/RelatedVideos) or
      `next/image` `placeholder="blur"` + a generated tiny `blurDataURL`. Highest-impact visible
      polish. (Same as prior [L6].)
- [ ] **[P2] Watch page: large empty white void on desktop when content is sparse** (added
      2026-08-11 by Claude Code) — below the (usually empty) comments the lower-left is dead white
      space. NOTE (Session 42): the "ad floating alone in the rail" half is resolved by [P3]
      (0.7.9 hides the ad by default). The remaining void is a desktop grid-height change
      (portrait player column is `100dvh-84px` tall while the center comments column is short) that
      needs visual iteration to get right — **deferred**: the dev environment couldn't build or
      visually verify reliably this session (machine memory pressure). Pick up when the browser
      pane / local build is healthy: constrain the center column height or pull Up Next/related to
      fill the desktop space, and verify against a sparse (empty-comments) video.
- [x] **[P3] Hide the "ADVERTISEMENT — Reserved placement" stub until there's real inventory** —
      DONE 2026-08-11 (Session 42), `0.7.9`, commit `68d17cd`, tag `v0.7.9`. Gated `AdSlot` behind
      `NEXT_PUBLIC_ADS_ENABLED` (off by default; documented in `.env.example`); both desktop +
      mobile call sites conditionally rendered. Correct-by-construction (flag unset in Vercel →
      not rendered) + Vercel deploy confirmed; live DOM check blocked by degraded browser pane.
      (added 2026-08-11 by Claude Code) — the labelled empty ad box on every watch page reads as
      unfinished to first-time visitors.
- [x] **[C1] Add Terms of Service + Privacy Policy pages (and footer links)** — DONE 2026-08-11
      (Session 43), `0.8.0`, commit `04b8cdd`, tag `v0.8.0`. Server-rendered `/terms` + `/privacy`
      (generateMetadata, theme-aware, crawlable) via shared `LegalPageShell`; linked from landing
      footer + signup agreement line; added to sitemap. **Live-verified via curl** (both 200 with
      real content; in sitemap). ⚠️ **Owner follow-up:** the policy copy is a baseline draft
      accurate to app behavior — have it reviewed by counsel and set the operating entity +
      governing-law jurisdiction before public launch. Consider adding content guidelines / DMCA
      given reposted content. (added 2026-08-11 by Claude Code)
- [ ] **[P4/P5] Landing hero polish** (added 2026-08-11 by Claude Code) — P4: the hero has no CTA
      button (only top-right nav) and lots of whitespace before Trending — add a primary CTA. P5:
      Trending #1 hero is a single portrait thumb centered in a wide gray box with big empty sides
      on desktop (same as prior [L2]). Design decisions.
- [ ] **[P6] A 404 console error fires on the watch page** (added 2026-08-11 by Claude Code) — one
      incidental resource 404s on load (no broken `<img>`, poster is set). Harmless but a polish
      tell; track down the request and silence it.
- [ ] **Content / seed-data realism (owner, mostly non-code)** (added 2026-08-11 by Claude Code) —
      the dominant prototype signal: catalog is essentially one creator (TisoneK) + scraped TikToks
      with visible third-party watermarks (e.g. "SR / Suleiman Reports"), seed-scale counts (40
      views, 1 subscriber, 0 likes), placeholder "T" avatars everywhere, TikTok-hashtag "popular
      tags", and an auto-"verified" badge on a 1-subscriber channel. Needs real/rights-cleared
      content from several creators, real avatars, plausible numbers, and gating the verified badge.
      Also a content-rights liability (watermarked reposts on a public site).

---
- [ ] **Re-check unpatched dependency advisories** (added 2026-09-02 by ZCode) — after
      0.9.1 (`4c93773`), `bun audit --production` still reports 8 findings (4 high,
      4 moderate) with NO fixed upstream release: `lodash`/`lodash-es` (code injection
      via `_.template` + prototype pollution in `_.unset`/`_.omit`; range ends at the
      current latest so an override cannot fix it; transitive via
      recharts/@reactuses/core; the app never calls the affected APIs) and
      `deepmerge-ts` (<8.0.0, major fix) + `defu` (<=6.1.4) in the dev-only Prisma CLI
      chain (no runtime request surface — do not force a major override inside the
      Prisma toolchain). Action: re-run `bun audit` when recharts/lodash/prisma release
      new versions; add overrides when fixed versions exist. Related: the open
      dependabot branches (npm_and_yarn/patch-and-minor, actions/cache-6,
      actions/checkout-7) are partially superseded by 0.9.1 — owner may close/refresh
      those PRs.
