# Architectural Decisions (append-only, ADR-style)

Decisions already made — future agents respect these rather than
relitigating them. To reverse one, append a new ADR that supersedes it.

<!-- TEMPLATE — copy below the last entry:
---
## ADR-N: <short title> (YYYY-MM-DD)
- **Status:** accepted | superseded by ADR-M
- **Context:** <what forced the decision>
- **Decision:** <what was decided>
- **Consequences:** <trade-offs accepted; what future agents must respect>
-->

---
## ADR-1: Internal-only behavior changes skip the public CHANGELOG + version bump (2026-07-11)
- **Status:** accepted
- **Context:** The 400-vs-500 malformed-body fix (commit b21a094) changed
  behavior, which normally triggers a CHANGELOG entry + version bump per the
  protocol's quality gates. But `CHANGELOG.md` is rendered on a public,
  unauthenticated `/changelog` page and is explicitly user-facing only
  (grandmother test; no API/route/technical detail). The fix is invisible to
  normal users — it only affects malformed API requests.
- **Decision:** Behavior changes that are not observable by a normal user go
  in `docs/DEVLOG.md` (technical log) only — not the public CHANGELOG — and do
  not, on their own, force a version bump. They ride along with the next
  user-facing release.
- **Consequences:** Future agents: the repo's public-changelog rule outranks
  the protocol's generic "behavior changed → changelog" gate. Judge by user
  visibility. Always still write the DEVLOG entry.

---
## ADR-2: The ESLint React-Compiler "burndown" is a react-query migration, deferred (2026-07-21)
- **Status:** accepted
- **Context:** The 35 pre-existing eslint errors are React-Compiler rules:
  22 `react-hooks/immutability` ("fetch fn accessed before declared"), 12
  `react-hooks/set-state-in-effect`, 1 `react-hooks/purity`. They looked like
  a mechanical lint cleanup. Empirically they are not: memoizing an
  effect-called fetch fn with `useCallback` (the fix for the immutability
  error) makes the fn analyzable, which then trips `set-state-in-effect` —
  and that rule fires for ANY effect that transitively calls setState, sync
  OR async (verified on both HomeFeed's `setLoading(true)` and UploadPage's
  await-then-`setCategories`). So the two rule classes are fully coupled:
  there is no immutability-only file that can be cleaned without surfacing a
  set-state error. The whole class is the fetch-in-`useEffect`+`setState`
  pattern across ~20 components.
- **Decision:** The correct fix is migrating those components to
  `@tanstack/react-query` (already a dependency) — an architectural change,
  flagged for approval per the standing workflow. On 2026-07-21 the owner
  chose "safe subset now, defer migration." Safe subset shipped (commit
  `67f1009`): `use-mobile.ts` → `useSyncExternalStore` and `sidebar.tsx`
  skeleton width → hashed `useId()`. Both are genuinely standalone (not
  fetch-in-effect). Baseline 35 → 33.
- **Consequences:** Do NOT attempt to "burn down" the remaining 33 with
  `useCallback`/reordering/eslint-disable — it just trades immutability for
  set-state and churns 20 files for no net gain. The CI lint step stays
  advisory (`continue-on-error`) until the react-query migration lands, at
  which point flip it to blocking. Treat the migration as its own scoped,
  approved effort with per-component verification (behavior + caching).
- **UPDATE 2026-07-22 (Session 6):** the defer was reversed — owner said
  "refactor it." The full react-query migration landed (commits
  `27ac41a`..`cf87a8c`): `QueryClientProvider` wired in
  `src/app/providers.tsx`; every fetch-in-effect component moved to
  `useQuery`/`useInfiniteQuery`, mutations to `setQueryData`, Notifications
  polling to `refetchInterval`; the two genuine external-system syncs
  (carousel embla-init, VideoPlayer HLS setup) kept as documented
  `eslint-disable`s. **eslint is now at 0 errors** and the CI lint step is
  **blocking** (`c4929d9`). Keep the "don't mechanically burn down" rule for
  any FUTURE fetch-in-effect code: reach for react-query, not `useCallback`.

---
## ADR-3: Pre-fetch = warm the react-query cache on hover/touch intent, not Next.js Link prefetch (2026-08-04)
- **Status:** accepted
- **Context:** Feature request: "Pre-fetch" (one of two feature sessions; the
  other is Lazy Loading). The obvious instinct — Next.js `<Link prefetch>` — does
  NOT apply here: this app does not navigate with `next/link`. Navigation is a
  **zustand client store** (`src/lib/store.tsx`, `useNavigation().navigate({page,…})`)
  that swaps the rendered view in place; the thin Next route files just render
  `<VertApp/>`. So there is no route-level prefetch to lean on. The real latency a
  user feels is the **data fetch** after clicking a video card: the watch page's
  primary query `['video', videoId]` (`fetchVideoDetail`) gates a loading skeleton,
  and `['related-videos', videoId]` fills the "Up Next" column — both fire only on
  mount, i.e. after the click.
- **Decision:** Implement pre-fetch as **react-query cache warming**. On pointer/touch
  intent over a video card, call `queryClient.prefetchQuery` for the same
  `queryKey`+`queryFn` the watch page will use, so the click renders from cache.
  - **Shared query definitions** — extract `fetchVideoDetail`/`fetchRelated` and
    `videoDetailQueryOptions(id)`/`relatedVideosQueryOptions(id)` into
    `src/lib/video-queries.ts`. This is mandatory, not just DRY: prefetch and the
    on-mount `useQuery` MUST use byte-identical key+fn or the warmed entry won't be
    read. (Also closes the backlog follow-up "shared query-key/hook factory".)
  - **Injection point** — `VideoCard` (the card shared by all 10 feeds: Home,
    Trending, Category, Tag, Search, Channel, History, Saved, Profile,
    PlaylistDetail) + the "Up Next" rows in `RelatedVideos`. One hook,
    `usePrefetchVideo()`, wraps the two `prefetchQuery` calls.
  - **Triggers** — `onMouseEnter` (desktop hover intent) + `onTouchStart` (mobile,
    fires just before the click, buying a head start). No `onFocus`: the card root
    is a non-focusable `div` (existing pattern), so wiring focus would imply a11y
    affordance that isn't there — out of scope for this feature.
  - **Cost control** — rely on react-query's built-in in-flight dedup +
    `staleTime: 60_000` (the app default): repeat hovers within 60s are cheap
    no-ops with zero extra network. No manual debounce/guard needed.
- **Alternatives considered:** (a) Next.js `<Link prefetch>` — rejected, app doesn't
  route via next/link. (b) Prefetch only `['video', id]` and skip related — rejected,
  related is a cheap second request and a hover is strong intent; warming both makes
  the whole watch page instant. (c) A manual `Set` of already-warmed ids — rejected as
  redundant with react-query's dedup and it would suppress a retry after a failed
  prefetch.
- **Consequences:** Future agents: `src/lib/video-queries.ts` is now the single source
  of truth for the video-detail + related query key/fn — new consumers import from it,
  don't re-inline. Prefetch is best-effort and silent (a failed prefetch just means the
  click falls back to a normal on-mount fetch — no user-visible error). If the watch
  page's query shape changes, update it in `video-queries.ts` and prefetch follows for
  free. The Lazy Loading feature (next session) is the deliberate counterpart — see the
  backlog item.

---
## ADR-4: Lazy Loading = native `loading="lazy"` on off-screen list/grid images; hero/LCP images stay eager (2026-08-04)
- **Status:** accepted
- **Context:** Feature request "Lazy Loading" (second of the two feature sessions;
  Pre-fetch was ADR-3). "Lazy loading" has three plausible readings in this codebase
  — (a) defer off-screen images, (b) infinite-scroll pagination, (c) code-split heavy
  components. The three produce very different diffs, so the scope was a genuine fork;
  the user chose **(a) lazy-load images**. Survey: ~21 `<img>` sites, **none** used
  `loading="lazy"` — every thumbnail and avatar loaded eagerly, so a feed grid or long
  comment list fetched all its images up front. All images already sit inside
  aspect-ratio / fixed-size wrappers, so deferring them causes **no layout shift**.
- **Decision:** Add `loading="lazy"` + `decoding="async"` to the images that render
  inside **repeating lists/grids** (the ones that can be numerous and off-screen):
  `VideoCard` thumbnail + channel avatar (covers all 10 feeds), `RelatedVideos` Up Next
  rows, `HistoryPage`, `PlaylistsPage`, `CommentSection` avatars, `LandingPage` trending
  cards, `CreatorStudio` (×2), `Sidebar` channel avatars, `SearchResults` channel
  avatars, and the `HomeFeed` "Popular Creators" shelf. **Deliberately left eager**
  (untouched) are the above-the-fold / LCP singletons, because `loading="lazy"` on an
  LCP image can delay it: the `VideoPlayer` poster, the `TrendingPage` + `HomeFeed`
  "Featured" heroes, the `ChannelPage`/`ProfilePage` banners, the `ChannelPage` header
  avatar, the `VideoDetail` (watch-page) channel avatar, and the `UploadPage` preview.
- **Alternatives considered:** (b) infinite scroll and (c) code-splitting — both valid
  "lazy" readings, both backlogged for their own sessions if wanted; the user picked
  images. Also considered a shared `<LazyImage>`/`<Thumbnail>` component to DRY up the
  attributes + the repeated `onError` fallback state — rejected as scope creep for this
  session (it would touch each component's fallback state logic and raise risk); the
  native-attribute change is surgical and behavior-preserving. Noted as a possible
  future refactor.
- **Consequences:** Off-screen images no longer download until they scroll near the
  viewport — less bandwidth and faster initial paint on image-heavy feeds, complementing
  ADR-3's data prefetch (prefetch warms JSON, lazy defers images). Future agents: when
  adding a NEW image inside a list/grid, add `loading="lazy" decoding="async"`; for a
  new hero/LCP/above-the-fold image, leave it eager (optionally `fetchpriority="high"`).
  The eager-hero exclusions are intentional — do not "fix" them to lazy.

---
## ADR-5: Image Optimization = `next/image` (serve-time WebP/AVIF + resize), not upload-time transcoding (2026-08-04)
- **Status:** accepted
- **Context:** Session 10 traced the live site's slow cold load to **large
  unoptimized images** — thumbnails served as raw uploads via plain `<img>` (PNGs up
  to 445KB), no resizing, no next-gen formats. Target for this session: "automatically
  compress + convert to WebP/AVIF so pages load instantly." Two implementation paths:
  (A) `next/image` — optimize at *serve* time via the Vercel Image Optimization CDN
  (resize per device + AVIF/WebP + cache + lazy), or (B) compress/convert at *upload*
  time with `sharp` (installed) and store optimized blobs.
- **Decision:** Use **`next/image` (A)**. Decisive factor: uploads go **browser →
  Vercel Blob directly** (`src/app/api/v1/upload/route.ts` only mints a client token;
  the file bytes never pass through a server function — that's how it beats the 4.5MB
  serverless body limit). So upload-time `sharp` compression has **no server hook** to
  run in — it would require re-architecting uploads (route bytes through the server, or
  add a post-upload blob-processing worker). `next/image` needs none of that AND it
  optimizes the images **already in the blob store** (the actual diagnosed problem),
  not just future uploads.
  - **Config:** add `images.formats: ['image/avif','image/webp']` (AVIF first, WebP
    fallback). `remotePatterns` already allows the blob host + `lh3.googleusercontent.com`.
  - **Scope this session:** migrate the high-impact **content thumbnails** (the big
    PNGs) to `<Image>` — `VideoCard` thumbnail (covers all 10 feeds), `RelatedVideos`,
    the `HomeFeed` + `TrendingPage` heroes (with `priority` for LCP), `HistoryPage`,
    `PlaylistsPage`, `LandingPage`, `CreatorStudio` (×2). Use `fill` + a context-tuned
    `sizes` (the containers already are `relative aspect-…`), keep each site's existing
    null-src/`onError` fallback. `next/image` is lazy by default, so it supersedes
    Session 9's manual `loading="lazy"` on the migrated thumbnails (removed there).
- **Alternatives considered:** (B) upload-time `sharp` — rejected as primary (no server
  hook in the direct-to-blob flow; doesn't fix existing images) but kept as a
  complementary backlog item (shrinks stored bytes for new uploads). Avatars (small,
  KB-range) and a shared `<OptimizedImage>` component — backlogged; low impact / risk of
  scope creep this session. Plain-`<img>` + a manual srcset — rejected (reinvents
  next/image).
- **Consequences:** Client downloads small resized AVIF/WebP instead of full-size PNGs
  → the diagnosed cold-load cost drops sharply, for existing and future images. Tradeoff:
  Vercel Image Optimization has transformation quotas/cost — acceptable and standard, but
  noted. `next/image` needs `sharp` at runtime for self-hosted/standalone (installed) and
  uses Vercel's optimizer on Vercel. Future agents: new content images use `<Image>` with
  `fill`+`sizes` (thumbnails) or `width`/`height` (avatars); heroes/LCP get `priority`.

---
## ADR-6: Defer progressive video loading; do not pretend it is transcoding (2026-08-04)
- **Status:** accepted
- **Context:** Session 10 measured the live cold-load problem: uploaded videos are
  stored as raw progressive `.mp4`/`.mov` objects, including a real **20MB** file.
  `VideoPlayer` already handled `.m3u8` with hls.js, but native progressive playback
  had no preload hint and could request the full object when a watch page opened.
- **Decision:** Set `preload="metadata"` and `playsInline` on the native `<video>` element.
  Treat `preload` as a browser hint: it reduces eager progressive downloads where the
  user agent honors it, but it is not a hard network guarantee and does not control
  hls.js-managed HLS loading. Keep the existing HLS/progressive split unchanged.
- **Alternatives considered:** `preload="none"` would reduce initial bytes further but
  would also delay duration/dimensions and is a less compatible watch-page default.
  Client-side FFmpeg/WASM was not chosen: it adds substantial browser cost and is not
  a reliable replacement for server-side media processing. Upload-time server
  transcoding is unavailable in the current direct browser-to-Blob flow without a
  separate worker or provider.
- **Consequences:** Watch pages avoid an eager full-file request on conforming browsers
  for progressive uploads, and mobile playback remains inline. File sizes and
  adaptive bitrate delivery are unchanged. A future transcoding/HLS or dedicated
  video-hosting decision must cover new uploads and migration of existing blobs;
  Vercel Blob alone does not provide that processing pipeline.

---
## ADR-7: Pushing to main is a production release (2026-08-04)
- **Status:** accepted
- **Context:** Vert deploys automatically to Vercel whenever `main` receives a
  push. Sessions 8–12 shipped user-visible features to `main`, but their notes
  remained under the public changelog's `[Unreleased]` heading, making deployed
  functionality appear pre-released.
- **Decision:** Treat every successful push to `main` as a release for changelog
  purposes. Before or with that push, move the shipped entries from `[Unreleased]`
  into the next numbered version section, bump `package.json` to the matching
  patch version when appropriate, update both CHANGELOG/DEVLOG comparison links,
  and push an annotated `v<version>` tag. Keep a fresh, empty `[Unreleased]`
  section for work not yet deployed.
- **Consequences:** The public `/changelog` reflects production reality rather
  than an unreleased staging queue. A release is not complete until the main
  commit and matching tag are pushed; future agents must not leave deployed
  user-facing work under `[Unreleased]`. Internal-only changes may still follow
  ADR-1 and remain DEVLOG-only.
