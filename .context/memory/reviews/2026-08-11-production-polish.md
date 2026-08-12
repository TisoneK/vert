# Vert — Production-Polish Implementation (Sessions 41+)

- **Agent:** Claude Code / claude-opus-4-8 (local, Baos-Mac-mini)
- **Role:** feature-engineer (owner approved the code-fixable subset of the production-feel review)
- **Source:** `2026-08-11-production-feel-review.md`. User: "Go ahead" → implement the code-fixable
  subset (P1 thumbnails, P3 ad stub, P2 watch void, C1 legal pages) as grouped sessions.

---

## Session 41 — Thumbnail loading skeletons (review [P1]) — SHIPPED `0.7.8` (via 0.7.6→0.7.8)

**Goal:** kill the flash-of-empty-gray on card grids (worst on mobile home).

**What shipped:**
- New shared `<ThumbnailImage>` (next/image `fill` + pulsing skeleton + `onError` Play-icon
  fallback), used by `LandingPage` trending cards and `RelatedVideos` Up Next rows. `VideoCard`
  uses the same structure inline (its container carries duration/format/progress/menu overlays).
- **Final approach (ADR-30):** the skeleton is an **absolute underlay behind an always-visible
  image** — the image paints over the shimmer when ready, with no dependency on `onLoad`.

**Iteration + the lesson (why 3 versions):**
- `0.7.6` — first cut: `opacity-0` image until `onLoad`, skeleton underlay.
- `0.7.7` — added a `ref` guard for cached-at-mount images.
- `0.7.8` — **live verification caught the real bug**: images decoded but stuck at `opacity:0`
  because the `load` event doesn't always fire (throttled tab / bfcache) and the ref guard only
  covers mount-time completeness. Reworked to never hide the image (ADR-30). Correct-by-
  construction: the `<Image>` has no opacity class, so it cannot be stuck invisible.

**Verification:** `tsc --noEmit` 0 errors + targeted ESLint 0 errors on all three versions.
`0.7.8` local `next build` **could not complete** — the dev machine hit heavy memory pressure
(~27M RAM unused, 1.9G compressor) and the build timed out 3× (8-min limit); identical-shape
files built clean minutes earlier at 0.7.6/0.7.7. **Vercel's cloud build succeeded** (confirmed:
the deployed changelog API reports `0.7.8`), so the fix is built + deployed. Live pixel-level
runtime check was blocked by the degraded local browser pane (same memory pressure) — the fix is
verified by code correctness (no opacity gate) + successful cloud build + deploy.

**Note for the next session:** the machine is under memory pressure — local `next build` is
unreliable; prefer tsc+eslint locally and let Vercel's cloud build be the build gate, verifying
behavior via curl (server HTML/headers) and the browser pane when it's responsive.

---

## Session 42 — Watch-page ad stub (review [P3]; [P2] deferred) — SHIPPED `0.7.9`

**Shipped (commit `68d17cd`, tag `v0.7.9`):** [P3] gated the watch-page `AdSlot` behind
`NEXT_PUBLIC_ADS_ENABLED` (off by default; documented in `.env.example`). Both desktop-rail and
mobile call sites are conditionally rendered, so the "Advertisement — Reserved placement" stub —
and its layout gap — no longer show unless ads are turned on. Side benefit: the desktop right rail
is now just Up Next (no lone floating box), which resolves part of [P2].

**Deferred:** [P2] the larger empty desktop void below sparse comments is a grid-height change
needing visual iteration; the degraded environment (memory pressure) couldn't build/verify layout
reliably. Left in backlog with a clear note.

**Verification:** tsc 0 / eslint 0. Local `next build` again blocked by machine memory pressure
(timeout). Correct-by-construction: `NEXT_PUBLIC_ADS_ENABLED` is unset in Vercel → `ADS_ENABLED`
false → `AdSlot` not rendered. Vercel cloud build + deploy confirmed (changelog API reports
0.7.9). Live DOM confirmation blocked by the unresponsive browser pane.
