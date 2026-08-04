# Inefficiency Log (append-only, mandatory)

Every session appends one block — honestly. Friction you absorb silently
is friction the next agent hits blind. "None this session" is valid only
if literally nothing slowed you down.

<!-- TEMPLATE — copy below the last entry:
---
## YYYY-MM-DD — <agent> / <model>
- **Problem:** <what went wrong or was slower than it should be>
- **Cost:** <rough time/effort wasted>
- **Cause:** <root cause if known>
- **Workaround / fix:** <what worked, or "unresolved">
- **Prevent next time:** <protocol/context change that would have avoided it>
-->

---
## 2026-07-11 — Claude Code / claude-opus-4-8
- **Problem:** Dual lockfiles (`bun.lock` + `package-lock.json`) plus `bun`
  not installed on this machine, while several `package.json` scripts
  (`start`, `db:seed`) hard-require `bun`. Ambiguous which package manager /
  dev command is correct on this environment.
- **Cost:** Minor — a few checks to confirm npm + `next dev` is the right local
  path (baseline install was already present, so no failed install).
- **Cause:** Repo supports both bun (canonical, per README) and npm (fallback);
  this machine only has npm/node.
- **Workaround / fix:** Used npm and `next dev`; recorded the machine's
  bun-absence and the npm path in `.context/system/environments.md`. Backlogged
  the dual-lockfile cleanup.
- **Prevent next time:** Next agent on this machine: read
  `system/environments.md` first — npm + `next dev`, no bun, no psql. Don't run
  bun-only scripts here.

---
## 2026-07-11 — Claude Code / claude-opus-4-8 (2)
- **Problem:** A backgrounded `eslint .` baseline run's captured output was
  truncated to just the header, and I read exit code 0 from the wrapping
  compound command — so I initially recorded a FALSE "lint clean (0 errors)"
  baseline and wrote it into the report + session entry. The real baseline is
  35 errors + 32 warnings (pre-existing, all in components/hooks/lib).
- **Cost:** Moderate — had to re-run eslint, re-verify error locations, and
  correct the report, session entry, and environments doc after the fact.
- **Cause:** Trusted an exit code + truncated background-task output instead of
  the eslint problem-summary line. The wrapping `{ ...; echo EXIT:$?; }` in a
  backgrounded compound command didn't reflect eslint's real exit status.
- **Workaround / fix:** Re-ran `npx eslint .` in the foreground and read the
  `✖ N problems (E errors, W warnings)` summary directly. Caught only because a
  personal memory note flagged "~32 pre-existing errors" — the contradiction
  prompted re-verification.
- **Prevent next time:** For lint/test baselines, always parse the printed
  problem-summary line; never conclude "clean" from an exit code alone,
  especially from a backgrounded/`tee`'d capture. Recorded the same warning in
  `system/environments.md`.

---
## 2026-07-14 — Claude Code / claude-fable-5
- **Problem:** Local functional testing of DB-touching flows impossible:
  `npx prisma dev` fails (npm EACCES on root-owned `~/.npm/_cacache` files),
  so the dev DB on localhost:51214 never starts. Separately, the seed demo
  accounts (admin@vert.com / user1@vert.com) do NOT exist in the local dev
  DB — a NextAuth credentials login attempt with them 401s even when the DB
  is up-to-spec assumptions said otherwise.
- **Cost:** Minor-moderate — a login-flow attempt, a probe-user registration
  (500), and log-reading before the root cause (DB down) was clear; then
  authenticated-route verification had to be downgraded to
  typecheck+pattern-identity evidence.
- **Cause:** Root-owned files in `~/.npm` from an old npm bug block npm's
  dynamic-subcommand install that `prisma dev` needs. Agents can't (and must
  not) sudo.
- **Workaround / fix:** Verified the fix class live on the unauthenticated
  `register` route (validation runs before any DB access). Backlogged the
  one-command user fix: `sudo chown -R 501:20 ~/.npm`.
- **Prevent next time:** Recorded in `system/environments.md`. Next agent:
  check that backlog item first; if still open, plan verification around
  unauthenticated/non-DB routes and say so in the report instead of
  burning time on login flows.

---
## 2026-07-14 — Claude Code / claude-fable-5 (2) — CORRECTION + new findings
- **Problem:** (a) CORRECTION to the entry above: the claim "seed demo
  accounts do NOT exist in the local dev DB" was WRONG — the 401s came from
  posting `email=` to NextAuth's credentials callback, which expects
  `identifier=` (`src/lib/auth.ts` authorize()). With the right field,
  user1@vert.com logs in fine and the seed accounts are present.
  (b) After the user fixed `~/.npm`, a bare `npx prisma dev` started the
  `default` server on port 51218 while the app expects 51214 — the project
  uses the **named** server `vert` (`npx prisma dev start vert --detach`),
  discoverable via `npx prisma dev ls`.
- **Cost:** Minor — one failed login round + one wrong-server start/stop
  cycle; but the wrong "no seed accounts" conclusion could have cost future
  sessions real time.
- **Cause:** Concluded "accounts missing" from a 401 without checking the
  credentials provider's expected field names; assumed `prisma dev` has one
  server per machine rather than named per-project servers.
- **Workaround / fix:** `prisma dev ls` to find the named server; grep
  `src/lib/auth.ts` before scripting a login. Both now recorded in
  `system/environments.md`.
- **Prevent next time:** A 401 from an auth endpoint is "credentials not
  accepted," not "user doesn't exist" — verify the request contract against
  the provider code before drawing data conclusions.

---
## 2026-08-01 — Buffy / deepseek-v4-flash
- **Problem:** The core-update path (`context-sync update`) is smooth, but its
  printed "next steps" hint only mentions regenerating kickoff/AGENTS — it
  doesn't mention the 0.5.0 `memory/sessions/` module adoption, the sessions.md
  `Core:`/`Notes:` field additions, or the SUMMARY.md seeding. A hurried agent
  could commit the core update and skip the memory-module side entirely.
- **Cost:** Minor — I caught it from the CHANGELOG; a few extra reads to map
  every new template/field to its memory file.
- **Cause:** The CHANGELOG is the authoritative migration doc, but the tool
  hint is terse; the 0.5.0 migration is spread across CHANGELOG + schema +
  templates.
- **Workaround / fix:** Read `core/CHANGELOG.md` fully before committing the
  update; walk the changed `core/templates/` against the live memory files.
- **Prevent next time:** Future sync sessions: after `context-sync update`,
  diff `git diff core/templates` to enumerate what must be regenerated/adopted
  (kickoff/AGENTS regeneration is called out by the tool; the sessions module
  and sessions.md entry-format fields are not).

---
## 2026-08-04 — Claude Code / claude-opus-4-8
- **Problem:** Live-verifying the prefetch feature in the browser pane cost
  more round-trips than expected. Three snags: (1) **port 3000 was held by an
  unrelated app** ("LocalMind") so `preview_start` refused — had to switch
  `.claude/launch.json` to `autoPort`. (2) **Browser-pane coordinate/ref
  `left_click` didn't register** the React onClick (the click "succeeded" but the
  page never navigated) — this was already logged for Session 6 but I re-hit it
  before recalling the fix. (3) I first tried triggering `onMouseEnter` by
  dispatching a synthetic `mouseover` via `javascript_tool` — React did NOT
  treat it as an enter, so no prefetch fired; a real CDP `hover` was needed. Also
  wasted one hover on the Trending page's featured card, which is a bespoke `<h2>`
  layout, NOT a `VideoCard`.
- **Cost:** Moderate — ~6 extra tool calls diagnosing the click/hover/port issues
  before landing a clean end-to-end verification.
- **Cause:** Session 6's "coordinate-clicks non-functional" note lived only in a
  session entry, not in `environments.md` where I'd have seen it during Step 3.
  Port 3000 assumption baked into the dev script + launch.json.
- **Workaround / fix:** Programmatic `element.click()` for navigation; real CDP
  `hover` (not dispatched events) for `onMouseEnter`; `autoPort` in the gitignored
  `.claude/launch.json`; verify via server request-log evidence. All now recorded
  in `system/environments.md` (Baos-Mac-mini block) so the next agent sees it at
  Step 3, not after re-hitting it.
- **Prevent next time:** Read the Baos-Mac-mini `environments.md` block before any
  browser-pane verification here: use `.click()` not coordinate-clicks, real
  `hover` not synthetic events, and expect an off-port dev server.

---
## 2026-08-04 — Claude Code / claude-opus-4-8 (Session 9)
- **Problem:** Live-verifying an IMAGE feature (lazy loading) was awkward because
  the seed DB has **no media** — every video's `thumbnailUrl` is null and channels'
  `avatarUrl` is null, so no `<img>` renders locally at all (cards show
  placeholders). Chased two dead ends trying to force images: (1) injected
  `/favicon.ico?i=N` as a fake thumbnail — it isn't a decodable image here, so
  `naturalWidth` stayed 0 and I couldn't measure load state; (2) switched to
  `/logo.svg?i=N` (decodes 150×150) but the injected `<img>` elements still didn't
  register as loaded in the tool's timing window even on-screen. Also re-confirmed
  `read_network_requests` returns empty while requests are actually firing.
- **Cost:** Moderate — several extra tool round-trips building a `window.fetch`
  patch + SPA-nav remount dance to get any `<img>` to render, then more trying
  (unsuccessfully) to time the deferral.
- **Cause:** Seed data carries no image URLs (same class of gap as Session 8's
  missing video files); the browser-pane network tool is unreliable here.
- **Workaround / fix:** Settled on a **render-level** verification — patch
  `window.fetch` to inject a same-origin thumbnail, remount a feed, and assert the
  DOM `<img>` carry `loading="lazy"`+`decoding="async"`. The actual network
  deferral is guaranteed native browser behavior; flagged a deploy-with-real-
  thumbnails check as the remaining verification (Pitfall #42 — reported honestly,
  didn't claim what I couldn't measure).
- **Prevent next time:** Recorded in `system/environments.md` (seed has no media;
  use `/logo.svg?i=N` not favicon to inject a decodable test image; don't trust
  `read_network_requests`). For any media/image feature here, plan on render-level
  verification or a deploy check, not local network timing.

---
## 2026-08-04 — Claude Code / claude-opus-4-8 (Session 10)
- **Problem:** Sessions 8 & 9 verified the prefetch/lazy features only against
  LOCAL seed data (null thumbnails, no video files), so I never exercised the real
  media path. When the user reported a 5-min cold load on the LIVE site and
  suspected those features, I initially reasoned from the local (media-less) view.
  The real cause turned out to be **large unoptimized media on the live blob
  store** (445KB PNG thumbnails via plain `<img>`; a 20MB `.mov` served as a raw
  progressive download) — invisible locally.
- **Cost:** Moderate — a round of investigation + one wrong initial framing before
  measuring the live site directly (production API + blob `Content-Length` via
  `curl`, `performance` resource timing on `vert-wine.vercel.app`).
- **Cause:** Local seed DB has no real media; both feature reports even flagged
  "verify on a deploy with real thumbnails" but that check wasn't done until the
  user pushed back.
- **Workaround / fix:** Measure the LIVE deployment for any media/perf claim —
  `curl -sI <blobUrl>` for real asset sizes, `performance.getEntriesByType('resource')`
  on the live origin, production API for real `thumbnailUrl`/`videoUrl`. The live
  URL is **https://vert-wine.vercel.app** (blob host `7omh3o8afcek9nbu.public.blob.vercel-storage.com`).
- **Prevent next time:** For ANY image/video/perf feature, verify against the live
  deploy (or real media), not local seed data — recorded in `system/environments.md`.
  A "verify on deploy" note in a report is not verification; do it or say it's
  unverified (Pitfall #42).

---
## 2026-08-04 — Claude Code / claude-opus-4-8 (Session 11)
- **Problem:** Minor — a `replace_all` Edit on CreatorStudio's two "identical"
  thumbnail `<img>` blocks only changed ONE, because the list-view and table-view
  copies had different leading indentation (the string wasn't byte-identical). Nearly
  left one `<img>` unmigrated.
- **Cost:** Trivial — caught immediately by a follow-up `grep -n "<img\|<Image"`
  verify pass before moving on.
- **Cause:** Assumed two visually-similar JSX blocks were identical; `replace_all`
  matches exact strings incl. whitespace, so different nesting depth = no match.
- **Workaround / fix:** After any multi-site `replace_all`, grep the file to confirm
  the expected count changed; migrate stragglers individually with their real indent.
- **Prevent next time:** For "same" markup at different nesting depths, don't trust
  `replace_all` blindly — verify the post-edit count. Otherwise a smooth session
  (real-media verification via `/_next/image` worked well — see environments.md).

---
## 2026-08-04 — Buffy / openai/gpt-5.6-luna (Session 12)
- **Problem:** Session 12 was interrupted with a legitimate in-progress task marker
  and unstaged product work; the resuming agent needed to reconstruct the exact
  Session 11 boundary before editing. Tool availability also varied during the
  handoff, so context was gathered through targeted shell agents.
- **Cost:** Minor — additional state inspection and validation passes; no work was
  lost because the diff was only two files and nothing was staged.
- **Cause:** The prior session stopped before committing product/docs/context work.
- **Workaround / fix:** Compared HEAD (`356af9c`) with the working tree, confirmed
  local/remote parity, preserved the existing `preload="metadata"` change, corrected
  the comment's hint-vs-guarantee wording, and committed product files separately
  as `879510e`.
- **Prevent next time:** When resuming an interrupted session, inspect `git status`,
  staged/unstaged diffs, and `origin/main` before making changes; treat the current
  task marker as a handoff, not a reason to restart the feature.
