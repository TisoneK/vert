# Architectural Decisions (append-only, ADR-style)

Decisions already made — future agents respect these rather than
relitigating them. To reverse one, append a new ADR that supersedes it.

> ADR-1…ADR-31 were re-seeded at the opening of this office (2026-09-15)
> as **one-line digests** — the decisions stand; the full original texts
> (Context/Decision/Consequences) are deliberate-lookback only, via
> `git show` of `history/office-001/plans/decisions.md` or any pre-
> 2026-09-15 commit. **New ADRs continue at ADR-32** — never renumber or
> reuse these IDs.

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
- **Status:** in force (digest)
- **Digest:** Only user-facing changes get a version bump + changelog entry; internal refactors/tooling ride along silently.

## ADR-2: Fetch-in-effect components migrate to react-query, not mechanical lint burndown (2026-07-21)
- **Status:** completed 2026-07-22 — rule remains in force (digest)
- **Digest:** All server-state reads go through `@tanstack/react-query` (`useQuery`/`useInfiniteQuery`, `setQueryData` for mutations); never reintroduce `useEffect(() => fetch()) + setState`. ESLint stayed 0-errors as CI-blocking.

## ADR-3: Pre-fetch = warm the react-query cache on hover/touch intent (2026-08-04)
- **Status:** in force (digest)
- **Digest:** Prefetch on interaction intent (`onMouseEnter`/`onTouchStart`/`onFocus`), not blanket Next.js Link prefetch.

## ADR-4: Lazy loading = native `loading="lazy"` on off-screen list/grid images; hero/LCP stays eager (2026-08-04)
- **Status:** in force (digest)

## ADR-5: Image optimization = `next/image` serve-time (WebP/AVIF + resize), not upload-time transcoding (2026-08-04)
- **Status:** in force (digest)

## ADR-6: Defer progressive video loading; do not mislabel it as transcoding (2026-08-04)
- **Status:** in force (digest)

## ADR-7: Pushing to `main` is a production release (2026-08-04)
- **Status:** in force — most load-bearing working agreement (digest)
- **Digest:** Vercel auto-deploys `main`; every pushed commit must leave the build green. (`main` is branch-protected: force-push + deletion blocked, admin enforcement; normal direct pushes are the workflow.)

## ADR-8: Subscription state is viewer-scoped; playback loading state is explicit (2026-08-04)
- **Status:** in force (digest)

## ADR-9: Preserve visible scroll and control affordances (2026-08-05)
- **Status:** in force (digest)

## ADR-10: Desktop navigation uses an overlay drawer (2026-08-05)
- **Status:** in force (digest)

## ADR-11: Featured is a resilient editorial card set (2026-08-05)
- **Status:** in force (digest)

## ADR-12: Host-safe remaining image optimization (avatars, banners) via optimizer routing (2026-08-07)
- **Status:** completed 0.6.15; rule in force (digest)

## ADR-13: Desktop portrait watch stage (2026-08-07)
- **Status:** in force (digest)

## ADR-14: Settings popup built on native buttons (2026-08-07)
- **Status:** in force (digest)

## ADR-15: Fixed desktop watch stage with one contextual rail (2026-08-07)
- **Status:** in force (digest)

## ADR-16: Three-column watch composition with viewport-fitted player (2026-08-07)
- **Status:** in force (digest)

## ADR-17: Viewport-budgeted player with fixed advertisement sibling (2026-08-08)
- **Status:** in force (digest)

## ADR-18: Compact desktop watch spacing (2026-08-08)
- **Status:** in force (digest)

## ADR-19: Watch-page interaction clarity without action-model expansion (2026-08-08)
- **Status:** in force (digest)

## ADR-20: Compact desktop Up Next previews (2026-08-08)
- **Status:** in force (digest)

## ADR-21: Format-aware desktop watch composition (2026-08-08)
- **Status:** in force (digest)

## ADR-22: Sequential watch-page UX polish (2026-08-08)
- **Status:** in force (digest)

## ADR-23: Light-mode surface hierarchy (2026-08-08)
- **Status:** in force (digest)

## ADR-24: Responsive volume disclosure (2026-08-08)
- **Status:** in force (digest)

## ADR-25: Server-generated per-route share/SEO metadata + sitemap/robots (2026-08-11)
- **Status:** shipped 0.7.0 — in force (digest)
- **Digest:** Content routes get async `generateMetadata` (direct db lookup → title/description/og:image/og:video); `app/sitemap.ts` + `app/robots.ts` supersede static robots.txt.

## ADR-26: Content cards navigate via real anchors, not `div onClick` (2026-08-11)
- **Status:** shipped 0.7.1 — in force (digest)
- **Digest:** Primary card target is `<a href>` + preventDefault client navigation — crawlable, focusable, open-in-new-tab; nested `<button>`s inside click-divs are the anti-pattern.

## ADR-27: The contact form must not fake a successful send (2026-08-11)
- **Status:** shipped 0.7.2 — in force (digest)
- **Digest:** UI promises only what the backend truly does (currently log-capture; real email pending a provider — see backlog B-2026-09-15-6).

## ADR-28: Serverless-correct rate limiting via a shared store (2026-08-11)
- **Status:** accepted design, implementation pending (digest)
- **Digest:** Replace the per-instance Map with Vercel KV / Upstash behind the same `rateLimit()` interface (atomic INCR+TTL); keep in-memory for local dev only.

## ADR-29: Theme-complete top-level pages — 404/500 (2026-08-11)
- **Status:** shipped 0.7.4 — in force (digest)
- **Digest:** Top-level error/legal pages use theme-aware tokens, never hard-coded light colors.

## ADR-30: Thumbnail loading = skeleton underlay behind an always-visible image (2026-08-11)
- **Status:** shipped 0.7.8 — in force (digest)
- **Digest:** Never JS-hide the `<img>` until load fires (load events can be missed — images got stuck invisible in an earlier iteration); skeleton pulses underneath; shared `<ThumbnailImage>`.

## ADR-31: Watch-page playback — autoplay, auto-advance (loop if last), persistent volume (2026-08-12)
- **Status:** shipped 0.9.0 — in force (digest)
- **Digest:** Sound-first autoplay with muted fallback; on end advance to Up Next, loop only if last; volume/mute persist via `usePlayerPrefs` (localStorage); poster-first.
