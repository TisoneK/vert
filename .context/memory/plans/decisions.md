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
