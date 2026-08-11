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

---
## 2026-08-04 — Buffy / openai/gpt-5.6-luna (Session 13)
- **Problem:** User-visible entries were left under `[Unreleased]` even though pushes
  to `main` automatically deploy production. The release correction also exposed
  that local/remote repositories had no existing `v0.6.*` tags despite historical
  changelog links assuming tags.
- **Cost:** Minor — required a release audit and a second commit for durable context.
- **Cause:** Feature sessions updated the changelog before deployment but no release
  step promoted the section after the main push; the prior convention was implicit.
- **Workaround / fix:** Published the deployed batch as `0.6.11`, bumped the package
  version, created/pushed annotated tag `v0.6.11`, and recorded ADR-7.
- **Prevent next time:** Release bookkeeping now happens as part of the feature
  workflow: a pushed user-visible change belongs in a numbered release, while
  `[Unreleased]` is reserved for work not yet on production.

---
## 2026-08-04 — Buffy / openai/gpt-5.6-luna (Session 14)
- **Problem:** The watch-page fix exposed several coupled state boundaries: the
  subscription result is viewer-specific, the existing query keys were not, and
  React's compiler lint rejects a direct effect-based state synchronization for
  the small CTA.
- **Cost:** Moderate — required one review-driven iteration after the first green
  validation pass; no broken commit was pushed.
- **Cause:** Existing prefetch/channel query keys were designed as public data
  keys, but the new `isSubscribed` boolean depends on the authenticated viewer.
- **Workaround / fix:** Added viewer IDs to video/channel query keys and prefetch,
  returned only a boolean from APIs, and remounted the CTA on viewer/server-state
  changes instead of using `setState` in an effect. Final typecheck/lint/build
  passed before release.- **Prevent next time:** When adding user-specific fields to a shared query, include the identity in every query and prefetch key before wiring the UI.

---
## 2026-08-05 — Buffy / openai/gpt-5.6-luna (Sessions 15–17)
- **Problem:** The repository tool environment intermittently lacked `read_files`/`rg` during the session, and one broad changelog write attempt replaced more content than intended.
- **Cost:** Minor — switched to targeted reads/sed/grep and restored the changelog from HEAD before applying exact replacements.
- **Cause:** Tool availability changed mid-session; the whole-file write path was too broad for a large public changelog.
- **Workaround / fix:** Used targeted file reads and `grep`/`sed`; restored `CHANGELOG.md` before making bounded string replacements.
- **Prevent next time:** Prefer exact replacements for large documents and verify `git diff --stat` immediately after any write; fall back to shell inspection when search/read helpers are unavailable.

---
## 2026-08-05 — Buffy / openai/gpt-5.6-luna (Sessions 18–20)
- **Problem:** Full-repo `npx eslint .` timed out twice in the local tool environment during the Featured session, so it did not produce a trustworthy repository-wide problem summary.
- **Cost:** Moderate — the combined validation command also timed out after typecheck/build work, requiring separate checks.
- **Cause:** The repository-wide lint traversal exceeded the available tool timeout; this was an execution timeout rather than a reported lint failure.
- **Workaround / fix:** Ran targeted ESLint on every changed product file; it passed with 0 errors. Typecheck passed and `npx next build` completed successfully with all 47 routes.
- **Prevent next time:** Run targeted lint and build/typecheck as separate commands first; only use full-repo lint when the environment provides a longer reliable foreground timeout, and never treat a timeout as a pass.

---
## 2026-08-07 — Buffy / openai/gpt-5.6-luna (Sessions 21–23)
- **Problem:** The prior Session 21 image migration was interrupted with a dirty worktree; port 3000 was occupied by an unrelated LocalMind app, preventing browser verification of the watch layout/settings; the first v0.6.15 release bookkeeping also left `package.json` at 0.6.14 and required a safe tag correction.
- **Cost:** Moderate — resumed and validated the incomplete image work before the requested sessions, repeated release/tag checks, and could not complete the browser pass.
- **Cause:** Session interruption preserved source changes but not a completed context/release closeout; the local environment has a fixed port collision; release version bump was not included in the first bookkeeping commit.
- **Workaround / fix:** Used targeted reads and review agents to finish the existing diff, normalized nullable URLs, added fallback resilience, published a corrective version commit/tag, and recorded the port limitation for the next browser pass.
- **Prevent next time:** On resume, inspect `git status` and the task lock before starting new work; verify package version and tag target together before publishing; use an auto-port dev server for browser validation when port 3000 is occupied.

---
## 2026-08-07 — Buffy / openai/gpt-5.6-luna (Session 24)
- **Problem:** Browser verification could not connect even after LocalMind was stopped: the tool sandbox terminates detached/background dev servers when the launching command exits. An attempted extra-argument launch also created two untracked files, and a combined typecheck/lint command timed out.
- **Cost:** Moderate — repeated server-launch attempts and one extra validation split; no product work was lost.
- **Cause:** The available browser/tool process boundary does not preserve background children across agent commands, and the project dev script already owns its port arguments.
- **Workaround / fix:** Removed only the generated `--hostname` and `127.0.0.1` artifacts, used the exact `npm run dev` script, separated TypeScript from targeted ESLint, and recorded browser verification as blocked rather than claiming a visual pass.
- **Prevent next time:** Prefer a tool-managed persistent preview or deployed URL for browser checks; do not append arguments to this script because its `tee` pipeline forwards them as shell commands. Run typecheck and lint as separate commands when the environment has strict timeouts.
---
## 2026-08-07 — Buffy / openai/gpt-5.6-luna (Session 25)
- **Problem:** Browser smoke verification could not run because port 3000 had no listener. One parallel typecheck initially hit a transient generated `.next/types/validator.ts` route-file race while the production build was running.
- **Cost:** Minor — one browser attempt was unavailable and typecheck needed a sequential rerun.
- **Cause:** The local tool environment does not keep a dev server running between commands, and parallel Next build/type generation can temporarily expose an incomplete generated route file.
- **Workaround / fix:** Recorded the browser limitation honestly, reran typecheck sequentially after the build settled, and confirmed targeted lint/diff checks plus production build passed.
- **Prevent next time:** Use a tool-managed persistent preview or deployed URL for browser checks; run generated-file-producing Next commands sequentially when typecheck is required.
---
## 2026-08-08 — Buffy / openai/gpt-5.6-luna (Session 26)
- **Problem:** The hosted browser runner loaded the site and public watch page, but repeated geometry/scroll attempts failed before inspection because the automation serialized empty `chrome-devtools` click/evaluate payloads (`uid`/`function` undefined).
- **Cost:** Moderate — hosted smoke checks succeeded, but exact player bounds and independent-scroll movement could not be measured visually in this session.
- **Cause:** Browser automation action serialization failed independently of the hosted application.
- **Workaround / fix:** Used code review, CSS math inspection, typecheck, targeted lint, diff check, production build, and no-interaction hosted smoke checks; recorded the limitation rather than claiming a geometry pass.
- **Prevent next time:** Prefer a browser run that supports direct URL/DOM inspection without emitting empty interaction calls, then capture player/rail bounding rectangles and scrollTop before and after a concrete Up Next scroll.
---
## 2026-08-08 — Buffy / openai/gpt-5.6-luna (Session 27)
- **Problem:** The watch spacing refinement required keeping the player and right rail's viewport math synchronized after reducing desktop grid padding.
- **Cost:** Low — the spacing change was isolated and validation remained sequential and clean.
- **Cause:** The previous `100dvh - 104px` budget encoded the old 24px top/bottom grid padding.
- **Workaround / fix:** Changed the desktop grid to `lg:p-3 lg:gap-4` and updated the stage/rail budget to `100dvh - 84px` plus the inset-adjusted frame calculation; mobile/tablet rules were left unchanged.
- **Prevent next time:** Keep the desktop spacing tokens and viewport budget documented together whenever the watch grid changes.
---
## 2026-08-08 — Buffy / openai/gpt-5.6-luna (Session 28)
- **Problem:** Resuming the interrupted session required separating a mixed product/context diff and reconciling release metadata before closeout; large memory files also exceeded single-read limits.
- **Cost:** Low — the pending work was preserved, and targeted reads plus separate product commits avoided rework.
- **Cause:** The prior session stopped after writing context notes but before committing the product phases and release bookkeeping; context history files are intentionally append-only and large.
- **Workaround / fix:** Audited the existing diff against ADRs, committed interaction and recommendation-density phases independently, used bounded reads/targeted validation, then completed `0.6.21` release and context records.
- **Prevent next time:** On any interrupted session, split the existing tree into product phases before editing; use targeted reads for large append-only memory files and verify release version/tag state before closeout.
---
## 2026-08-08 — Buffy / openai/gpt-5.6-luna (Session 30)
- **Problem:** A broad exact-string edit that added the visible Share label duplicated its `title` JSX attribute, which the first phase-specific review did not catch.
- **Cost:** Low — the final typecheck caught it immediately before release.
- **Cause:** The replacement targeted an existing attribute block while another replacement had already added the same attribute.
- **Workaround / fix:** Read the combined JSX around the action row, removed the duplicate attribute, and reran the complete validation/build suite.
- **Prevent next time:** After multiple same-file replacements, inspect the final rendered block before parallel review; use one consolidated replacement for closely related JSX attributes.

---
## 2026-08-08 — Buffy / openai/gpt-5.6-luna (Session 29)
- **Problem:** Making the outer watch grid follow actual media dimensions required a callback from `VideoPlayer`, and the first pass exposed a nullability error followed by a Rules-of-Hooks placement error during validation.
- **Cost:** Low — the failures were caught before commit by typecheck/lint and fixed with a source-scoped resolved-ratio state plus a stable callback declared before early returns.
- **Cause:** The initial layout change considered only database format, then the metadata correction was added incrementally without immediately re-running the hook-order checks.
- **Workaround / fix:** Keyed the player by video ID, scoped resolved media to video ID/source URL, moved the callback above conditional returns, and aligned its dependencies to stable primitive fields. Final typecheck, targeted lint, diff check, and build all passed.
- **Prevent next time:** When lifting child-resolved media state into a parent, design the callback lifecycle and hook placement together before the first validation run.
---
## 2026-08-08 — Buffy / openai/gpt-5.6-luna (Session 31)
- **Problem:** The initial light-mode change touched several surfaces, making it easy to accidentally add decorative classes without meaningful visual effect or leave low-contrast microcopy unchanged.
- **Cost:** Low — review caught the ineffective card radius and faint Advertisement text before closeout.
- **Cause:** Surface refinements were applied across mixed component contexts rather than from a single shared surface token.
- **Workaround / fix:** Used the shared light theme tokens for the global ladder, then reviewed each watch surface for actual boundary/elevation impact and corrected the ad contrast.
- **Prevent next time:** Pair every visual class addition with a specific surface or boundary, and check small supporting text against the new background before release.
---
## 2026-08-08 — Buffy / openai/gpt-5.6-luna (Session 32)
- **Problem:** The volume disclosure change exposed lifecycle edge cases across hover, touch, auto-hide, zero-volume restoration, and keyboard focus.
- **Cost:** Low — targeted review caught each state issue before release.
- **Cause:** The existing player had separate React visibility state and native media mute/volume state, while touch needed a disclosure mode without hover.
- **Workaround / fix:** Added explicit hover/focus/touch state, outside dismissal, last-audible-volume restoration, native mute synchronization, and focus-within control reveal; reran typecheck, lint, diff check, and build after each correction.
- **Prevent next time:** Model the interaction state table before editing media controls: pointer type × disclosure state × mute/volume state × auto-hide lifecycle.

---
## 2026-08-11 — Claude Code / claude-opus-4-8 (Session 33)
- **Problem:** Two minor browser-pane snags during the live-site research sweep: (1) a few
  `mcp__Claude_Browser__computer` click actions timed out with "Browser pane is currently
  hidden," and (2) after toggling dark mode the screenshot kept rendering light even though the
  DOM `<html>` class had flipped to `dark` and computed `body` bg was near-black — the hidden/
  unfocused pane doesn't always repaint the screenshot.
- **Cost:** Minor — a couple of retries + one moment of "did the toggle work?" before I
  confirmed via computed styles instead of the screenshot.
- **Cause:** The in-app Claude Browser pane throttles/parks rendering when not focused; screenshot
  reflects the last painted frame, not necessarily current DOM state.
- **Workaround / fix:** For state that matters, read it via `javascript_tool` (DOM class,
  `getComputedStyle`, `fetch()` of the server HTML) rather than trusting the screenshot;
  re-screenshot / take a fresh action to recover from a "pane hidden" timeout.
- **Prevent next time:** Recorded in `system/environments.md` (Baos-Mac-mini browser-pane note):
  the Claude Browser pane works well against the LIVE deploy for research, but prefer JS-driven
  inspection over pixel screenshots for anything state-dependent (theme, video playback, metadata).
  Otherwise a smooth session — the pane reached the deployed site with no dev server, which was
  faster than the port-3000/dev-server dance prior sessions hit.
