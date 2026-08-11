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
  user-facing work under `[Unreleased]`.  Internal-only changes may still follow ADR-1 and remain DEVLOG-only.

---
## ADR-8: Keep subscription state viewer-scoped and make playback loading state explicit (2026-08-04)
- **Status:** accepted
- **Context:** The watch page duplicated the subscriber count for logged-out
  visitors, hard-coded `initialSubscribed={false}` for all authenticated users,
  and used query keys that did not distinguish anonymous from authenticated
  viewers. Separately, `VideoPlayer` used `object-contain` and started its
  buffering state as `true`, leaving a ready paused video looking letterboxed
  or stuck behind a spinner.
- **Decision:** Keep the subscriber count in channel metadata only; use an
  outline `Subscribe` CTA for logged-out visitors that navigates to login; return
  a boolean `isSubscribed` from channel/video APIs and include viewer identity in
  channel/video query keys and hover prefetch keys. Use `object-cover` for the
  player frame, clear readiness on metadata/media events, and render the spinner
  only while active playback is buffering. Remount the small subscribe control
  when viewer/server subscription state changes rather than syncing local state
  through a cascading effect.
- **Consequences:** Logged-out and logged-in watch pages show semantically correct
  actions, and React Query cannot reuse anonymous subscription state for another
  viewer. Playback no longer presents an initial loader over a ready paused video,
  while active stalls remain visible. `object-cover` may crop content when the
  frame ratio differs, and cannot remove black bars encoded into the source file;
  source-level media cleanup remains a separate concern.

---
## ADR-9: Preserve visible scroll and control affordances (2026-08-05)
- **Status:** accepted
- **Context:** The main viewport and horizontal shelves explicitly hid native scrollbars, while progress transforms and the custom video-player overlay permitted edge values or invisible hit targets to interfere with interaction.
- **Decision:** Keep scrollbars visibly styled on scrollable surfaces; clamp progress values to their valid range and clip tracks; make hidden player overlays pointer-transparent, keep center affordances as buttons, and expose keyboard-safe slider semantics for seeking.
- **Consequences:** Users receive clearer scroll feedback and reliable pointer/keyboard playback controls. Native overlay-scrollbar platforms may still hide tracks according to OS settings, and the player remains a custom control implementation that needs targeted regression tests when its layering changes.

---
## ADR-10: Use an overlay drawer for desktop navigation (2026-08-05)
- **Status:** accepted
- **Context:** The desktop sidebar's icon rail remained visible and consumed page width even when users wanted the navigation closed. The mobile experience already used an on-demand drawer.
- **Decision:** Keep desktop navigation closed by default and open the full navigation as a fixed overlay drawer from the header menu button. Preserve focus management and close on backdrop, Escape, explicit close, or navigation selection.
- **Consequences:** Content gets the full desktop viewport until navigation is requested, matching the mobile interaction model. The drawer requires responsive focus cleanup when crossing into the mobile breakpoint.

---
## ADR-11: Treat Featured as a resilient editorial card set (2026-08-05)
- **Status:** accepted
- **Context:** The homepage had enough trending data for a collection but rendered only the first item as a bespoke hero. Sparse responses made the section look accidentally incomplete.
- **Decision:** Render up to four standard video cards as Featured, fill sparse sets from latest feed data with a transparent `Featured picks` label, and remove Featured IDs from the lower Trending section.
- **Consequences:** The homepage has consistent card density and no duplicate Featured/Trending items. Featured fallback content is clearly labeled rather than implying a curated editorial source.

---
## ADR-12: Host-safe remaining image optimization (2026-08-07)
- **Status:** accepted
- **Context:** Session 11 optimized thumbnails with `next/image`, but avatars and banners still used native images. The API accepts arbitrary HTTPS image URLs, while Next's optimizer only accepts configured remote hosts.
- **Decision:** Route known HTTPS Google profile and Vercel Blob URLs through `next/image`; preserve native `<img>` rendering for other valid HTTPS sources. Add URL-keyed error fallbacks so failed images render initials/placeholders without affecting other list items.
- **Consequences:** Known assets receive responsive optimization without rejecting existing OAuth/user-hosted images. Unsupported hosts do not gain optimizer transformations, and future host allowlist changes must update `isNextImageSafeUrl` and `next.config.ts` together.

---
## ADR-13: Desktop portrait watch stage (2026-08-07)
- **Status:** accepted
- **Context:** The app's single scroll viewport made a tall portrait player and contextual content compete for vertical space. Desktop platforms use a readable portrait stage with adjacent recommendations, while mobile stacks content.
- **Decision:** Use a desktop two-column watch stage with the portrait player left-aligned and sticky within the existing app viewport; keep Up Next in a right rail with bounded independent scrolling; return to normal stacked flow below the desktop breakpoint.
- **Consequences:** Portrait playback remains visible while users browse contextual content, and desktop horizontal space is used effectively. The sticky surface must remain opaque and below the app header; ads are not fabricated or integrated without a separate provider decision.

---
## ADR-14: Native-button settings popup (2026-08-07)
- **Status:** accepted
- **Context:** The player already had speed/quality state and handlers, but its popup was clipped by an `overflow-hidden` control row, making the settings gear appear non-functional on compact portrait players.
- **Decision:** Remove the clipping ancestor, use a labeled group of native buttons, close on outside pointer/Escape, restore focus to the trigger on Escape, and omit the portrait volume slider before metadata is available.
- **Consequences:** Existing speed/HLS quality behavior is exposed without duplicating logic. The popup keeps standard Tab/Enter button behavior instead of claiming a full ARIA menu model without arrow-key navigation.

---
## ADR-15: Fixed desktop watch stage with one contextual rail (2026-08-07)
- **Status:** accepted
- **Context:** The previous watch layout used a sticky player and related-video rail, but comments remained outside the desktop context column, there was no reserved ad slot, and compact lists could introduce nested scroll surfaces. Portrait videos also initially fell back to a landscape ratio before metadata arrived.
- **Decision:** Use a bounded responsive desktop grid with the player left-aligned in the left column and a single sticky, independently scrollable right rail ordered Advertisement, Comments, and Up Next. Keep mobile/tablet in normal document flow with the same content order. Use the known video format for the initial aspect-ratio fallback. Keep the ad as a provider-neutral layout slot.
- **Consequences:** Desktop users retain a readable portrait player while contextual content remains adjacent and discoverable. The rail has one clear scrollbar, while mobile avoids sticky/nested scrolling. Real ad delivery remains a separate service decision and must not be fabricated in the UI.
---
---
## ADR-16: Three-column watch composition with viewport-fitted player (2026-08-07)
- **Status:** accepted
- **Context:** The user refined the watch-page request so the video should occupy the left side, profile/details and comments should be in the middle, and Up Next should be on the right. Portrait playback was still too tall for the screen.
- **Decision:** Use three bounded desktop grid tracks: player left, profile/details/comments center, and Advertisement/Up Next right. On desktop, portrait players use a `calc(100dvh - 4rem)` height stage and derive width from their aspect ratio; landscape/square media remains width-driven. Use `object-contain` so the complete frame stays visible. Keep mobile/tablet stacked.
- **Consequences:** The desktop hierarchy matches the requested reading pattern and portrait content fits within the visible app viewport. Landscape media avoids an unnecessary blank height reservation. The player’s settings popup remains outside its clipping wrapper, and the ad remains a provider-neutral slot.
---
## ADR-17: Viewport-budgeted player with fixed advertisement sibling (2026-08-08)
- **Status:** accepted
- **Context:** The Session 25 player still exceeded the app's actual main viewport because its `100dvh` budget did not account for the 56px header and 24px watch-grid padding. Advertisement also shared the right rail's scroll context, so browsing Up Next could move the ad away.
- **Decision:** Treat the app's desktop player budget as `100dvh - 104px` (header plus grid padding), subtract the stage inset when deriving portrait frame width, and apply the fixed-height stage only at the desktop breakpoint. Let real media metadata override stale format hints. Make the right rail a fixed-height flex column with a non-scrolling Advertisement sibling and a separate `min-h-0 flex-1 overflow-y-auto overscroll-contain` Up Next region. Keep mobile/tablet in natural document flow.
- **Consequences:** Portrait playback no longer creates an extra page scrollbar or oversized dark framing, and the advertisement remains visible while recommendations scroll. The browser runner's precise hosted geometry pass remains blocked by malformed empty interaction payloads; layout correctness is covered by code review, typecheck, lint, diff check, and production build.
---
## ADR-18: Compact desktop watch spacing (2026-08-08)
- **Status:** accepted
- **Context:** After the viewport and rail fixes, the watch page still had excessive desktop whitespace around the player from broad grid padding and column gap.
- **Decision:** At the desktop breakpoint only, use 12px grid padding and a 16px column gap. Keep mobile/tablet spacing unchanged. Update the shared player/right-rail viewport budget from `100dvh - 104px` to `100dvh - 84px`, and keep the 4px player inset accounted for in the frame calculation.
- **Consequences:** The player sits closer to surrounding content and uses more available desktop width without changing the mobile reading flow or breaking viewport-fit behavior.

---
## ADR-19: Watch-page interaction clarity without action-model expansion (2026-08-08)
- **Status:** accepted
- **Context:** The UX reviews identified a large empty-state gap and weak discoverability for icon-only watch actions. They also suggested showing dislike counts and moving Report into an overflow menu, but neither suggestion was supported by product requirements or runtime evidence.
- **Decision:** Keep the existing action model and improve its current affordances: use a compact invitation for empty comments, label the empty section as `Comments` rather than repeating a zero count, add browser titles and accessible labels to Save/Share, and explain the sign-in requirement for disabled vote controls. Do not add dislike counts or restructure Report without a separate product decision.
- **Consequences:** Empty watch pages use less unexplained space and assistive/hover users receive clearer guidance while the restrained action hierarchy remains intact. Future action reorganization must be evaluated as an interaction-model change, not folded into spacing polish.

---
## ADR-20: Compact desktop Up Next previews (2026-08-08)
- **Status:** accepted
- **Context:** The desktop right rail has limited vertical space and the supplied reviews consistently noted that native portrait thumbnails expose too few recommendations above the fold. Mobile/tablet layouts have more natural document flow and benefit from preserving each video's actual format.
- **Decision:** In the `compact` desktop Up Next variant only, use a consistent 16:9 preview frame with the existing cover behavior. Keep format-specific portrait, square, and landscape previews in the normal mobile/tablet variant.
- **Consequences:** Desktop users can scan more recommendations at the cost of cropping portrait previews in that rail. The crop is intentional and must not be generalized to the mobile/tablet list without new evidence.

---
## ADR-21: Format-aware desktop watch composition (2026-08-08)
- **Status:** accepted
- **Context:** The three-column desktop watch composition is well suited to portrait media, but it constrains landscape video unnecessarily and leaves the player/details relationship less coherent. The player already resolves actual media dimensions after metadata loads, so the outer layout must be able to correct stale database format hints too.
- **Decision:** Use the database format as the initial desktop fallback. For landscape media, switch to a two-column desktop grid with a wide main column stacking the player, details, and comments, plus the existing Advertisement/Up Next rail. Keep portrait and square media in the existing three-column desktop composition. Report the actual media ratio from `VideoPlayer` after `loadedmetadata`, scope the resolved ratio to video ID and source URL, and key the player by video ID. Keep all formats in natural single-column flow below the desktop breakpoint.
- **Consequences:** Landscape videos gain a larger, more readable player and a coherent primary-content column without changing the established portrait hierarchy or mobile/tablet behavior. The layout can shift once metadata resolves when stored format data is stale; this is preferable to permanently reserving the wrong composition. Recommendation placement, ad behavior, and external download tooling remain unchanged.

---
## ADR-22: Sequential watch-page UX polish (2026-08-08)
- **Status:** accepted
- **Context:** After the format-aware desktop composition, the remaining reviews identified several safe interaction and hierarchy improvements: cramped player controls, passive logged-out comment copy, faint composer contrast, equal visual weight for Report, and a visually dominant provider-neutral ad placeholder.
- **Decision:** Improve the existing watch-page interaction model without adding services or inventing content. Use larger player targets while hiding only the compact volume slider below `md`; provide a real logged-out login CTA and stronger composer focus/surface styling; give Share and Save responsive labels, move Report into a More overflow menu, and reuse `FlagDialog` through a controlled triggerless mode; quiet the ad slot and strengthen Up Next heading/fallback copy.
- **Consequences:** Playback and commenting become more actionable across mouse, touch, keyboard, and assistive use; primary actions gain hierarchy while reporting remains discoverable; compact players avoid control overflow. The ad remains clearly a reserved provider-neutral slot. Dislike counts, generated metadata, recommendation deduplication, real ad inventory, and a broad Vert identity redesign remain separate product/content/service decisions.
---
## ADR-23: Light-mode surface hierarchy (2026-08-08)
- **Status:** accepted
- **Context:** Dark mode had a clear surface ladder, while light mode placed the application canvas and most content surfaces close to pure white with faint boundaries. The result made grouping, elevation, and hierarchy harder to read and gave the interface a prototype-like quality.
- **Decision:** Keep the existing restrained visual language but give light mode a soft off-white application canvas, bright white elevated surfaces, stronger border/input contrast, and restrained shadows. Apply the treatment to the shell/header and watch-page detail, comments CTA, Advertisement, and Up Next groups. Leave dark-mode tokens and responsive composition unchanged.
- **Consequences:** Light mode gains clearer structure and scanability without introducing a new brand palette or changing mobile/tablet flow. Shadows remain deliberately subtle, and no artificial card treatment is added where it would not create meaningful grouping.
---
## ADR-24: Responsive volume disclosure (2026-08-08)
- **Status:** accepted
- **Context:** The player had a desktop-only inline volume range input for non-portrait formats, while compact portrait players had no adjustable volume surface and touch users had no hover equivalent. The control row could not grow permanently without risking overflow.
- **Decision:** Keep the speaker as the mute control, but render the range input in an anchored popover above it. Reveal the popover on desktop hover or keyboard focus. On touch/pen input, use the first tap on an audible player to open the popover, the second speaker tap to mute, and a tap while muted to restore the last audible volume. Dismiss explicit touch disclosure when tapping elsewhere. Synchronize slider changes with both React state and the native media element, and reveal the overall control bar on keyboard focus.
- **Consequences:** Volume adjustment is discoverable on desktop, usable on mobile, and safe for narrow players because it does not consume control-row width. Existing keyboard shortcuts, playback controls, settings, and format-aware sizing remain unchanged.

---
## ADR-25: Server-generated per-route share/SEO metadata + sitemap/robots (2026-08-11)
- **Status:** proposed (Session 33 research — architectural; awaiting owner approval to implement)
- **Context:** The whole app is client-rendered: every route file is a thin `'use client'`
  shell rendering `<VertApp/>`, and the only `Metadata` is the global one in
  `src/app/layout.tsx` (no `generateMetadata` anywhere). Verified in production: `/watch/<id>`
  returns `<title>Vert</title>`, the generic description, no `og:image`/`og:video`,
  `twitter:card=summary`, and the video title is absent from the server HTML. So shared links
  render blank social cards and crawlers index nothing — directly undercutting the "share
  portrait video" value prop. The watch page already carries a code comment acknowledging the
  gap. See review 2026-08-11 [H1], [L7].
- **Decision:** Split the thin route shells so that content routes (`watch/[id]`,
  `channel/[id]`, `category/[slug]`, `tag/[slug]`) export an async `generateMetadata({params})`
  that does a direct DB lookup (via the lazy `db` singleton) and returns per-item `title`,
  `description`, `openGraph` (with `og:image` = the video thumbnail, `og:type=video.other`,
  and `og:video` where available), and `twitter:card='summary_large_image'` (or
  `player` with `twitter:player` for inline preview). `<VertApp/>` still renders the
  interactive client view underneath — this is a metadata/head addition, not a full SSR
  rewrite of the app. Add `app/sitemap.ts` (enumerate public videos/channels/categories) and
  `app/robots.ts` (reference the sitemap), superseding the static `public/robots.txt`.
- **Alternatives considered:** (a) Full SSR/RSC rewrite of the feed/watch views — rejected as
  far larger scope than the problem; metadata generation is separable from interactivity.
  (b) Client-side `document.title`/meta updates — rejected: social scrapers and crawlers read
  the initial server HTML, not post-hydration DOM. (c) Leaving `public/robots.txt` as-is —
  rejected: it invites crawlers to pages with no server content.
- **Consequences:** Shared links get real titles/thumbnails/inline players; content becomes
  crawlable and indexable. Cost: each content route now runs a DB query at request time for
  metadata (cache with `revalidate`/tags). Requires the metadata query to tolerate missing
  media (fall back to site defaults). Pairs with ADR-26 (real links) — metadata without
  crawlable links is half a fix. Future agents: new content routes must export
  `generateMetadata`; keep the sitemap generator in sync when adding public entity types.
- **UPDATE 2026-08-11 (Session 34) — accepted + shipped (`0.7.0`, commit `4e63b6d`, tag
  `v0.7.0`).** Owner approved implementation. Delivered exactly as decided: `watch/[id]`,
  `channel/[id]`, `category/[slug]`, `tag/[slug]` converted from `'use client'` shells to
  server components exporting async `generateMetadata` (narrow `select` lookups, try/catch →
  `FALLBACK_METADATA`); shared `src/lib/site-metadata.ts` (SITE_URL resolution, `absoluteUrl`,
  `clampDescription`, fallback); `metadataBase` set in root layout; `app/sitemap.ts` +
  `app/robots.ts` added, `public/robots.txt` removed. tsc 0 / eslint 0 / `next build` exit 0
  (build output: `/robots.txt` + `/sitemap.xml` generated; content routes now `ƒ`). Live OG
  output on the deploy confirmed post-push.

---
## ADR-26: Content cards navigate via real anchors, not `div onClick` (2026-08-11)
- **Status:** proposed (Session 33 research — awaiting owner approval to implement)
- **Context:** `VideoCard`'s root is `<div className="cursor-pointer" onClick={navigate}>`
  (`VideoCard.tsx:100`) with **zero `<a>` anchors** on content pages. Navigation works via the
  zustand store + `history.pushState` (`store.ts`), so URLs are shareable — but the cards are
  not crawlable (crawlers don't execute onClick), not keyboard-focusable/activatable (the div
  has no `tabIndex`/`role`), and offer no middle-click/⌘-click/open-in-new-tab/copy-link. Real
  `<button>`s (channel name, tags, context menu) are nested **inside** the clickable div — an
  interactive-nesting a11y anti-pattern. See review 2026-08-11 [M1].
- **Decision:** Render the card's primary click target as a real anchor:
  `<a href={viewToPath({page:'video',videoId})} onClick={e => { e.preventDefault(); navigate(...) }}>`.
  This keeps the existing zustand SPA navigation (preventDefault + `navigate`) while giving the
  browser a real href for crawl, keyboard focus/Enter, hover URL preview, and modified-click
  open-in-new-tab (let un-modified left-clicks call `navigate`; let ⌘/ctrl/middle-click fall
  through to native). Apply the same pattern to `RelatedVideos` "Up Next" rows and
  `LandingPage` trending cards. Resolve interactive nesting by moving the nested buttons out of
  the anchor's flow (siblings/overlay) or converting the card to a link-with-overlaid-controls
  layout. `viewToPath` (already in `store.ts`) is the single source for hrefs.
- **Alternatives considered:** (a) Adding `role="link"` + `tabIndex` + keydown to the div —
  rejected: reimplements anchor semantics badly and still isn't crawlable. (b) `next/link` —
  works, but the app deliberately navigates via zustand (ADR-3 context), so a plain `<a>` +
  preventDefault preserves that model with less churn. (c) Leave as-is — rejected: crawl +
  keyboard access are core to a public video platform.
- **Consequences:** Cards become crawlable, keyboard-accessible, and open-in-new-tab-able while
  SPA navigation is unchanged for normal clicks. Closes the backlog "Prefetch on keyboard
  focus" blocker (cards gain focus, so `onFocus={prefetchVideo}` becomes wireable). Future
  agents: new content cards use an `<a href={viewToPath(...)}>` root, not `div onClick`.

---
## ADR-27: Contact form must not fake a successful send (2026-08-11)
- **Status:** accepted
- **Context:** `ContactPage.tsx` `handleSubmit` does `setTimeout(800)` then renders "Message
  sent — We'll get back to you by email," but nothing is transmitted (`// TODO: wire to a real
  endpoint … the form just simulates submission`). The user is told, falsely, that a bug report
  or question was delivered. See review 2026-08-11 [H2].
- **Decision:** A delivered-success state must reflect an actual delivery. Until email
  infrastructure exists, either (a) add a real `POST /api/v1/contact` that persists the message
  (DB row) and/or forwards it, and only then show "Message sent"; or (b) replace the form with
  honest copy (e.g., a mailto/contact address) and no simulated success. Never show a
  "delivered" confirmation for a no-op. This is a correctness/integrity call, not a design
  preference — hence accepted rather than proposed.
- **Consequences:** Users get truthful feedback. Option (a) needs a storage/forwarding
  decision (shares the email-provider dependency already tracked for password reset). Whichever
  path, remove the `setTimeout` simulation. Future agents: no UI may claim an external side
  effect (sent/saved/submitted) that the code does not actually perform.

---
## ADR-28: Serverless-correct rate limiting via a shared store (2026-08-11)
- **Status:** proposed (Session 33 research — needs infra decision/credentials)
- **Context:** `src/lib/rate-limit.ts` is a module-level in-memory `Map`; its comment assumes
  a "single-instance" v1. The production target is **Vercel serverless** — multi-instance,
  cold-starting — so `login` (10/min/IP) and `signup` (5/min/IP) counters are per-instance and
  reset frequently, making brute-force / account-spam protection much weaker than it appears.
  See review 2026-08-11 [M2].
- **Decision:** Move the rate-limit store behind a shared backend — **Vercel KV or Upstash
  Redis** — keeping the existing `rateLimit(req, config, key)` interface (the file already
  documents this as the intended migration). Use an atomic INCR + TTL per fixed window. Keep
  the in-memory implementation as a local-dev fallback when no KV env var is present, so local
  work needs no external service.
- **Alternatives considered:** (a) Keep in-memory — rejected: does not survive multi-instance/
  cold-start. (b) Edge middleware with a durable store — heavier; the per-route call sites
  already exist and just need a shared store. (c) A hosted WAF/rate-limit product — out of
  scope for now.
- **Consequences:** Auth/upload/mutation throttles become effective across instances. Adds a
  KV dependency + credentials (env var) and a small per-request latency on limited routes.
  Future agents: don't rely on the in-memory limiter for any prod security guarantee until this
  lands; treat it as best-effort/local only.

---
## ADR-29: Theme-complete top-level pages (404/500) (2026-08-11)
- **Status:** accepted
- **Context:** `not-found.tsx` and `error.tsx` render outside the themed `<VertApp/>` shell and
  hard-code `bg-white` / `text-zinc-900` with no `dark:` variants, so a dark-mode user hits a
  white flash/page. The rest of the app is theme-aware (ADR-23). See review 2026-08-11 [L1].
- **Decision:** Any top-level route rendered outside the app shell (404, 500, and future
  standalone pages) must use theme-aware tokens (`bg-background`/`text-foreground` or explicit
  `dark:` variants) so it honors the stored theme. Since these render before/around React and
  next-themes, rely on the same `.dark`-class signal the `layout.tsx` no-flash script sets.
- **Consequences:** Error/404 pages match the user's theme instead of forcing light. Trivial,
  low-risk, reversible — accepted. Future agents: new top-level/standalone pages are built
  theme-aware from the start.

---
