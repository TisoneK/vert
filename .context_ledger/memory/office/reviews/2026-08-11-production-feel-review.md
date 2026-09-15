# Vert — Production-Feel Research (Session 40)

- **Date:** 2026-08-11
- **Agent:** Claude Code / claude-opus-4-8 (local) — research/review mode, **no code changes**
- **Lens:** "What makes Vert feel like a prototype rather than a shipped product?"
- **Surfaces walked (live, https://vert-wine.vercel.app):** logged-out landing (desktop + mobile),
  a watch page, Trending, Explore, Search, a channel page.
- **Context:** this pass is AFTER the S34–S39 releases (0.7.0–0.7.5), which already fixed the
  structural issues (share metadata, real links, contact, etc.). What remains is **feel** —
  content, polish, and missing production chrome.

---

## The single biggest driver: it reads as *seeded*, not *lived-in*

Everything below reinforces one impression — Vert looks like a demo populated by its author, not
a product real people use. This is mostly a **content/data** problem, not a code problem, but it's
the dominant "prototype" signal:

- **One creator.** Essentially the entire catalog is by **TisoneK** (the owner) plus a single
  `Suleiman234`. Every Trending item, every "Up Next", every channel — one person.
- **Scraped third-party clips.** The videos are reposted TikToks/reels, some with **visible
  third-party watermarks** (e.g. an "SR / Suleiman Reports" logo burned into a football clip).
  Watermarked reposts signal "seed data," and are also a real content-rights liability for a
  public product.
- **Seed-scale numbers everywhere.** "40 views", "18 views", "3 views", "**1 subscriber**",
  "0" likes, empty comments ("Be the first to start the conversation") on every video.
- **No real profile pictures.** Every avatar is a gray **"T" initial** placeholder — creator
  header, watch-page byline, comments, Up Next. Zero real imagery for people.
- **"Popular tags" are generic TikTok hashtags** — `fyp`, `lyrics`, `electronicmusic`,
  `dancemusic`, `music` — which reads as scraped, not curated.
- **A "verified" checkmark on a 1-subscriber channel** (TisoneK) — verification on an account
  with one subscriber reads as fake/unearned.

**Fix is largely non-code:** real (or realistic, rights-cleared) content from several creators,
real avatars, and plausible engagement numbers would remove ~70% of the prototype feel on their
own. Until then, no amount of UI polish will fully land.

---

## UI / layout polish gaps (code — fixable)

**P1 — Thumbnails flash as empty gray boxes on every load (highest-impact polish gap).**
The `next/image` thumbnails have no skeleton or blur-up placeholder, so on first paint (and any
slow connection) cards render as blank gray rectangles until the image decodes. On the **mobile
home the entire above-the-fold is empty gray 9:16 boxes** with just titles beneath — the worst
possible first impression. Desktop shows the same flash (I caught a Trending card and an Up Next
thumbnail blank mid-load). Fix: a shimmer/skeleton over the image container, or `next/image`
`placeholder="blur"` with a tiny generated `blurDataURL`. (Previously logged as review [L6].)

**P2 — The watch page has a large empty white void on desktop.**
Below the (usually empty) comments, the entire lower-left of the watch page is dead white space,
while the right rail's Advertisement box floats alone at the top. The layout doesn't gracefully
handle sparse content — it looks unfinished rather than minimal. Consider constraining the column
height, moving Up Next/related to fill the space on desktop, or a denser empty-comments state.

**P3 — "ADVERTISEMENT — Reserved placement" is a visible stub on the core page.**
A boxed empty ad slot labelled "Reserved placement" sits at the top of every watch page's right
rail. It's a deliberate provider-neutral placeholder (ADR-15/22), but to a first-time visitor it
reads as an unfinished module. Until there's real inventory, hiding it (or collapsing it to
nothing) would look more finished than a labelled empty box.

**P4 — The landing hero is bare.**
"Watch and share portrait video." + one subtitle line, then a big gap before Trending — no hero
CTA button, no imagery/product shot. The only actions are the small top-right "Log in / Sign up".
A production landing puts a primary CTA in the hero.

**P5 — Trending #1 hero wastes horizontal space.**
On desktop the "#1 Trending" featured item is a single portrait thumbnail centered in a very wide
gray container, with large empty areas left and right. (Previously [L2].)

**P6 — A 404 console error fires on the watch page.**
One resource 404s on load (no broken `<img>`, poster is set, so it's an incidental request —
likely a probe/asset). Harmless functionally, but console errors on the core page are a polish
tell; worth tracking down and silencing.

---

## Missing production chrome (mostly not built yet)

**C1 — No legal/policy pages.** The footer has only **Changelog** and **Contact**. A public
product with accounts, user uploads, and comments needs **Terms of Service** and a **Privacy
Policy** at minimum (and arguably content guidelines / DMCA, given reposted content). Their
absence is the clearest "not production" signal after the seed content.

**C2 — Thin footer / no About or Help.** No About, Help/FAQ, or company/contact chrome beyond the
two links. Feels like a scaffold.

**C3 — Minimal branding.** The brand is just the word "Vert" (a system-font wordmark) everywhere;
no logo mark, and the favicon is a generated "V" square. Fine for MVP, but part of the demo feel.

**C4 — No new-user onboarding.** "Create an account" drops you straight in; there's no first-run
guidance, empty-state nudges to upload, or "your feed is empty" onboarding.

---

## What already feels production-quality (keep)

Genuinely good and not to be mistaken for prototype: the restrained visual design and consistent
purple accent, working dark mode, the accessible player, the polished secondary pages (search
filters, changelog with version sidebar, 404/500), and — post-S34–S39 — real share previews,
crawlable links, a working contact form, and a CSP. The *shell* is production-grade; the
*contents and the last 10% of polish* are what read as prototype.

---

## Recommended priority

1. **Content** (owner, non-code): several creators, real avatars, rights-cleared/native videos,
   realistic counts, and drop the auto-"verified" badge until it means something. — biggest win.
2. **P1 thumbnail placeholders** (code): removes the most visible flash-of-empty on every load.
3. **C1 legal pages** (Terms/Privacy): required for a real public product.
4. **P2/P3 watch-page void + ad stub** (code): make the core page look finished when sparse.
5. **P4/P5 hero polish**, **P6 the 404**: lower priority.

Findings recorded in `tasks/backlog.md`; no code changed this session.
