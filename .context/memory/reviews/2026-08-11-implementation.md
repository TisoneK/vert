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
