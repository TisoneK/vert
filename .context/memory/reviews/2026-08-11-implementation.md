# Vert — Implementation of the 2026-08-11 Review (Sessions 34+)

- **Agent:** Claude Code / claude-opus-4-8 (local, Baos-Mac-mini)
- **Role:** feature-engineer (owner approved implementing the review this turn)
- **Source:** findings + ADRs from `2026-08-11-review.md`. The user asked to implement the
  review as grouped, self-contained `.context` sessions, autonomously, without stopping.
- **Groups:** S34 SEO/shareability · S35 crawlable links · S36 contact integrity ·
  S37 auth hardening · S38 theme error pages · S39 UX polish batch.

This is the shared implementation report; each group also has its own `agents/sessions.md`
entry + `SUMMARY.md` line + `current.md` cycle.

---

## Session 34 — SEO & shareability (ADR-25, review [H1]/[L7]) — SHIPPED `0.7.0`

**What shipped (commit `4e63b6d`, tag `v0.7.0`):**
- `watch/[id]`, `channel/[id]`, `category/[slug]`, `tag/[slug]` converted from `'use client'`
  shells to **server components** exporting async `generateMetadata` — per-item title,
  description, `og:image` (thumbnail/banner/avatar), `og:video`, `og:type`, canonical, and
  Twitter cards (`summary_large_image` when an image exists). Each lookup is `select`-only and
  wrapped in try/catch → `FALLBACK_METADATA`, so a DB hiccup yields valid site tags, never a 500.
- New `src/lib/site-metadata.ts` — `SITE_URL` (env → Vercel → prod fallback), `absoluteUrl`,
  `clampDescription`, `FALLBACK_METADATA`. `metadataBase` set in the root layout.
- New `app/sitemap.ts` (static routes + public videos/channels/categories/tags, each query
  guarded, 5000/type cap, hourly revalidate) and `app/robots.ts` (allow public, disallow
  api/account surfaces, sitemap reference). Removed the static `public/robots.txt`.

**Verification:** `tsc --noEmit` 0 errors; targeted ESLint 0 errors; `next build` exit 0
(output confirms `/robots.txt` + `/sitemap.xml` generate and the four content routes are now
`ƒ` server-rendered). **Live-verified on the deploy** (real DB): `/watch/<id>` returns
`<title>Floor · TisoneK</title>`, `og:image`=real thumbnail, `og:video`=real mp4,
`og:type=video.other`, `twitter:card=summary_large_image`; `/robots.txt` and `/sitemap.xml`
serve correctly with real video URLs. ADR-25 → accepted/shipped.

**Note:** `generateMetadata` adds one narrow DB read per content-route request. Acceptable;
revisit with cache tags if it shows up in DB load.

---

## Session 35 — Crawlable/accessible links (ADR-26, review [M1]) — SHIPPED `0.7.1`

**What shipped (commit `45eccc2`, tag `v0.7.1`):**
- **VideoCard** — stretched-link pattern: title wrapped in `<a href={viewToPath(...)}>` whose
  `after:absolute after:inset-0` overlay makes the whole card one crawlable, keyboard-focusable
  target; nested channel/tag/context-menu controls raised above it (`relative z-10`, wrappers
  `z-20`). Root switched from `cursor-pointer`+`onClick` to `relative`. Added `onFocus` prefetch.
- **RelatedVideos** + **LandingPage** trending cards became `<a>` directly (no nested
  interactives). LandingPage "See all" + tag chips anchored via a shared `spaLink(view)` helper.
- Every onClick: modified-click guard (`meta/ctrl/shift/alt/button!==0` → native) then
  `preventDefault()` + `navigate()`, preserving SPA nav for plain left-clicks.

**Verification:** tsc 0 / eslint 0 / `next build` exit 0. **Live-verified**: landing page renders
6 `a[href^="/watch/"]` (sample `/watch/cmr3el1ie…`), 5 `a[href^="/tag/"]`, anchored "See all".
ADR-26 accepted/shipped; backlog [M1] + "prefetch on keyboard focus" both checked.

---

## Session 36 — Contact-form integrity (ADR-27, review [H2]) — SHIPPED `0.7.2`

**Constraints:** no email provider, and DB schema changes need owner approval — so no Contact
table. Implemented ADR-27 option (a) within those bounds.

**What shipped (commit `8183ed9`, tag `v0.7.2`):**
- New `POST /api/v1/contact` — validates name/email/message (non-string guards, email regex,
  length caps), rate-limited by IP (new `contact` tier, 5/min), **captures the message to the
  server log** (Vercel logs), and forwards to `CONTACT_WEBHOOK_URL` if set (best-effort).
- `ContactPage` POSTs for real and shows success only on a 2xx; inline error on failure.
  Success copy changed from "we'll get back to you by email" → "we've received your message and
  will follow up if it needs a reply." Removed the `setTimeout` simulation.
- Documented `CONTACT_WEBHOOK_URL` + `NEXT_PUBLIC_SITE_URL` in `.env.example`.

**Verification:** tsc 0 / eslint 0 / `next build` exit 0 (`/api/v1/contact` registered).
**Live-verified**: empty→400, bad email→400 (`"Please enter a valid email address"`),
valid→`{"ok":true}` 200. ADR-27 accepted/shipped; backlog [H2] checked. Follow-up when email
infra lands: upgrade log-capture → real email (webhook hook already in place).

---

## Session 37 — Auth hardening (review [M4]) — SHIPPED `0.7.3`

**What shipped (commit `0d2083b`, tag `v0.7.3`):**
- Password minimum raised 6 → 8 on both `SignupForm` (client) and `register/route.ts` (server),
  kept in sync; placeholder/error copy updated.
- Added a no-dependency server-side common-password blocklist (a `Set` of the passwords that
  dominate credential-stuffing lists, matched case-insensitively) → 400 "too common".

**Not done (infra-blocked, still in backlog):** M3 password reset (needs email provider), M2
rate-limit KV (needs Vercel KV/Upstash credentials), and a breach-corpus (HaveIBeenPwned) check.

**Verification:** tsc 0 / eslint 0 / `next build` exit 0. **Live-verified**: 6-char password →
400 "must be at least 8 characters"; `password123` → 400 "too common" (both reject before any
account is created). Backlog [M4] checked.

---

## Session 38 — Theme-aware 404/500 (ADR-29, review [L1]) — SHIPPED `0.7.4`

**What shipped (commit `57635df`, tag `v0.7.4`):** added `dark:` variants to `not-found.tsx`
and `error.tsx` (`dark:bg-zinc-950`, `dark:text-zinc-100/400`, dark border/hover on the error
page's "Go home" button). Both render inside the themed root layout, so no structural change.

**Verification:** tsc 0 / eslint 0 / `next build` exit 0. **Live-verified**: the served 404 HTML
now contains `dark:bg-zinc-950`. ADR-29 shipped; backlog [L1] checked.
