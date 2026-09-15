# Backlog (live queue — open work only)

Open items for future sessions, **arranged by priority so the shape of
the work is visible the moment the file opens**: one row per item, in
its priority table. When an item is finished, **delete its row** — the
backlog holds only open work, never completed rows. The completion
record is the finishing session's `agents/sessions.md` entry and the
commit itself; git history keeps every removed row, so deleting loses
nothing. Never delete a row whose item is still open — a row vanishing
from the diff without a matching session entry is a dropped handoff,
not cleanup. (Legacy checkbox-format backlogs: `ledger-mem closeout`
sweeps checked-off `- [x]` tombstones a session left behind — dry run
by default; `--confirm` deletes.)

Every row gets a stable **ID** — `B-<added YYYY-MM-DD>-<n>`, n = that
date's next sequence in the file — and a **Summary** cell with enough
context that a fresh agent can act on the item without any chat
history; keep status qualifiers in the summary text ("partial",
"done, pending sign-off", "deferred by owner", "advisory"). Priority
is the table an item sits in — when unsure, Medium.

This backlog belongs to the **current office**. When the office closes,
open items do not carry over implicitly — the closing session re-seeds
into the new office's backlog only what still matters, and records the
rest in the permanent record (`history/office-<NNN>.md`, "Open threads").

Full spec: `.context_ledger/core/schemas/ledger-schema.md` →
"The backlog: arrangement + workstream view".

> All rows below were re-seeded at the opening of this office (2026-09-15)
> from the previous office's open work, in plain words — see
> `history/office-001.md` for the full handoff.

## Open Items

### High Priority

| ID | Summary |
|----|---------|
| B-2026-09-15-1 | **Content / seed-data realism (owner, mostly non-code)** — the dominant "prototype" signal: catalog is essentially one creator + scraped watermarked clips ("SR"-style third-party marks), seed-scale counts (40 views, 1 subscriber, 0 likes), placeholder "T" avatars, TikTok-hashtag "popular tags", auto-"verified" badge on a 1-subscriber channel. Needs several creators' rights-cleared content, real avatars, plausible numbers, verified-badge gating. Also a content-rights liability on a public site. |
| B-2026-09-15-2 | **Test runner + tests (Vitest unit / Playwright E2E)** — no tests exist; CI workflow already runs typecheck + build (hard) and lint (blocking). Remaining blockers: GitHub Actions is billing-locked (owner) — no green run yet. When tests land, backfill regression coverage for the 400-malformed-body and non-string-body-field API fixes. Optional follow-on: extend `main` branch protection with required status checks once CI runs green (force-push + deletion already blocked; PR/check requirements deliberately left off to preserve the direct-push policy). |

### Medium Priority

| ID | Summary |
|----|---------|
| B-2026-09-15-3 | **Slow video load — transcode & delivery architecture** — uploads are raw progressive-download `.mp4`/`.mov` (a real file is ~20MB); `preload="metadata"` shipped (hint only; hls.js path unaffected). Needs a service decision + credentials + migration plan for existing blobs: dedicated video platform or separate processing worker producing H.264 + HLS renditions; decide convert-or-reject `.mov`. Vercel Blob is not a transcoder. |
| B-2026-09-15-4 | **[M2] Rate limiting is per-instance in-memory** — `src/lib/rate-limit.ts` module Map; on Vercel serverless (multi-instance, cold starts) login/signup throttles reset per instance. Design exists (shared-store ADR); implementation blocked on owner providing Vercel KV / Upstash credentials. Keep in-memory as local-dev fallback behind the same `rateLimit()` interface. |
| B-2026-09-15-5 | **[M3] Password reset flow** — no reset route; email/password users who forget are locked out. Needs request-reset (rate-limited, token emailed) + reset-confirm + LoginForm link; blocked on an email provider (shared dependency with contact-email item). |
| B-2026-09-15-6 | **Provider-blocked security items** — contact form currently log-captures only (webhook hook in place): send real email once a provider exists. Add HaveIBeenPwned k-anonymity breach check to complement the min-8 + common-password blocklist. |
| B-2026-09-15-7 | **Deferred design-judgment polish** — L2 trending-#1 hero wastes desktop width (portrait thumb in wide gray box); L6 thumbnail blur placeholder needs a `blurDataURL` pipeline; L8 logged-out landing header has no search bar while in-app does; L9 mobile header crowded at 375px; L11 ~97 `console.*` calls — considered audit (keep error logs, drop noise). Each needs a design call, not a mechanical fix. |
| B-2026-09-15-8 | **[P2] Watch page desktop void** — lower-left dead white space when comments are sparse (portrait player column `100dvh-84px` vs short center column). The ad-rail half is already resolved. Deferred previously because it needs visual iteration with a healthy local build: constrain center column or pull Up Next/related to fill; verify against an empty-comments video. |
| B-2026-09-15-9 | **[P4] Landing hero CTA** — hero has only top-right nav, no primary CTA, lots of whitespace before Trending. Design decision. |
| B-2026-09-15-10 | **[P6] Incidental 404 console error on watch page** — one resource 404s on load (not a broken `<img>`, poster is set); harmless polish tell — find the request and silence it. |
| B-2026-09-15-11 | **Feature: infinite scroll** — HomeFeed loads a fixed 24 and stops; Category/Tag use `useInfiniteQuery` behind a button. Add an IntersectionObserver sentinel calling `fetchNextPage()` (precedent exists in `ChangelogPage.tsx`). Feature-engineer role; design ADR first. |
| B-2026-09-15-12 | **Feature: code-split heavy client components** — `next/dynamic` for the `@mdxeditor/editor` in CreatorStudio and the HLS `VideoPlayer` to shrink the initial bundle; measure before/after. ADR first. |
| B-2026-09-15-13 | **Dependency-advisory watch** — 8 `bun audit --production` findings have no fixed upstream release (lodash/lodash-es transitive via recharts/@reactuses/core — app never calls affected APIs; deepmerge-ts/defu in dev-only Prisma CLI chain). Re-run the audit when upstreams ship fixes; do not force major overrides into the Prisma toolchain. Related: dependabot branches partially superseded by the 0.9.1 patch release — owner may close/refresh those PRs. |
| B-2026-09-15-14 | **Re-verify environments after the 1.1.3 core migration** — on the "Tison-Windows" box confirm `sh .context_ledger/core/bin/ledger-sync verify` is green and gates work (the old CRLF false-fail should be gone via the shipped `.gitattributes`; the entry there is marked re-verify). Also paths in the DESKTOP-3LRR8MD entry marked re-verify. |

### Low Priority

| ID | Summary |
|----|---------|
| B-2026-09-15-15 | **Shared `<OptimizedImage>` component** — wrap `next/image` + the repeated null-src/`onError` fallback patterns (~20 sites) so new content images get optimization + fallback for free. Refactor, not a feature. |
| B-2026-09-15-16 | **Upload-time image compression** — uploads go browser → Vercel Blob untouched; a post-upload step (fetch → sharp → re-store) would shrink stored bytes. Delivery is already optimized; not urgent. |
| B-2026-09-15-17 | **VideoPlayer poster → next/image** — the one remaining plain `<img>` from the thumbnail migration; deliberately left native (sits beside canvas frame-capture logic). Close, or migrate only if poster delivery matters. Advisory. |

<!-- TEMPLATE — add one row to the matching priority table:
| B-<YYYY-MM-DD>-<n> | <enough context that a fresh agent can act on
      this without any chat history — status qualifiers in the text> |
-->
