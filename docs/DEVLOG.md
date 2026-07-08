# Devlog

Technical change log for developers working on Vert. Complements
[`CHANGELOG.md`](../CHANGELOG.md) (which is user-facing) with implementation
details, file references, and architectural reasoning.

> **For contributors and AI agents:** `CHANGELOG.md` is rendered on a public,
> unauthenticated page — see the notice at the top of that file for what
> must never go there (file/route/library names, env vars, security
> vulnerability mechanics, commit hashes). All of that technical detail
> belongs here instead. Write the DEVLOG entry first, then the plain-language
> CHANGELOG entry.

Entries are grouped by version, matching `CHANGELOG.md`. Newest first.

---

## [Unreleased]

_Nothing yet._

---

## [0.6.6] — 2026-07-08

### Fixed

#### Admin panel dark mode gaps (40 surfaces)

**File:** `src/components/vert/AdminDashboard.tsx`

The v0.5.0 dark mode pass covered ~37 component files but missed several surfaces in the admin panel. 40 light-mode class strings had no `dark:` variant, leaving them rendering as bright light-colored boxes when the rest of the app was in dark mode.

**Surfaces fixed:**
- Flag moderation action buttons (Review/Remove/Action) — `text-blue-600 hover:bg-blue-50`, `text-red-600 hover:bg-red-50`, `text-emerald-600 hover:bg-emerald-50` → added `dark:text-*-400 dark:hover:bg-*-950/30`
- Database tab amber warning banner — `bg-amber-50 border-amber-200 text-amber-900 text-amber-700` → added `dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200 dark:text-amber-400`
- Migration error/success status banners — `bg-red-50` / `bg-emerald-50` → `dark:bg-*-950/30`
- Pending migration cards — `bg-white border-orange-200` → `dark:bg-zinc-800 dark:border-orange-900`
- Applied/pending status badges — `border-*-200 text-*-700` → `dark:border-*-900 dark:text-*-400`
- "All migrations applied" empty state — `bg-emerald-50 text-emerald-900` → `dark:bg-emerald-950/30 dark:text-emerald-300`
- Create test accounts button + form — `bg-violet-50 border-violet-200 text-violet-700` → `dark:bg-violet-950/30 dark:border-violet-900 dark:text-violet-400`
- Test result banner + credentials table — `bg-emerald-50 bg-white border-emerald-100` → `dark:bg-emerald-950/30 dark:bg-zinc-800 dark:border-emerald-900`
- User management role/active/suspended/channel-suspended badges — all colored badges got `dark:` border + text variants
- Role toggle / activate toggle action buttons — `hover:bg-violet-100` / `hover:bg-emerald-100` → `dark:hover:bg-*-900/30`
- Users table footer bar — `bg-white` → `dark:bg-zinc-800`
- Flag status badge class map (reviewed/actioned) — `bg-blue-100 text-blue-600` / `bg-emerald-100 text-emerald-600` → added `dark:bg-*-900/40 dark:text-*-400`

**Not changed:** solid colored status dots (`bg-orange-500`, `bg-emerald-500`, `bg-red-500`) — these are full-saturation accent colors that read fine on both light and dark backgrounds, no dark variant needed.

---

## [0.6.5] — 2026-07-08

### Fixed

#### Mobile drawer missing Creator Studio and Admin Panel

**File:** `src/components/vert/MobileNav.tsx`

The desktop `Sidebar.tsx` has a "Creator" section (lines 312–347) gated by `user && (user.channelId || user.role === 'admin')`, containing Creator Studio (gated by `user.channelId`) and Admin Panel (gated by `user.role === 'admin'`). The mobile drawer (`MobileNav.tsx`) had no equivalent — mobile users could only reach those pages by navigating to them indirectly (e.g. via the profile page). The bottom nav's "More" tab highlights `creator-studio` and `admin` as active states, but tapping "More" just opened the drawer which didn't contain the links.

**Fix:** added a matching "Creator" section inside the drawer's logged-in block, placed after Playlists and before Upload. Same gating logic as the desktop sidebar:
- Section wrapper: `user.channelId || user.role === 'admin'`
- Creator Studio button: `user.channelId` (only users with a channel)
- Admin Panel button: `user.role === 'admin'`

Uses the same icons as the desktop sidebar (`BarChart3` for Creator Studio, `Shield` for Admin Panel) and the same "CREATOR" uppercase label with a top divider. Button styling matches the drawer's existing pattern (`bg-zinc-100 dark:bg-zinc-800` + `border-l-2 border-violet-600` for active, rather than the desktop sidebar's `bg-violet-50` — consistent with every other button in the drawer). Both buttons call `onDrawerOpenChange(false)` after navigating, matching every other drawer entry.

---

## [0.6.4] — 2026-07-08

### Fixed

#### Mobile video grids: 2 columns → 1 column (full-width cards)

**Files:** `HomeFeed.tsx`, `TrendingPage.tsx`, `ExplorePage.tsx`, `ChannelPage.tsx`, `CategoryPage.tsx`, `TagPage.tsx`, `PlaylistsPage.tsx`, `PlaylistDetailPage.tsx`, `ProfilePage.tsx`, `SavedPage.tsx`, `SearchResults.tsx` (23 grid instances total)

Reported via a side-by-side screenshot comparison against Dailymotion's mobile feed: Vert's video grids used `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` — 2 columns on mobile. Each card was ~48% of the viewport width, so landscape videos (which rely on width to be legible) were too small, and the overall feed felt cramped compared to Dailymotion's single-column full-width cards.

**Fix:** replaced the mobile breakpoint from `grid-cols-2` to `grid-cols-1` across all 23 video grid instances. The full progression is now `grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5` (PlaylistsPage: `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`). Mobile gets full-width cards; `sm` (640px+) gets 2 columns; `md` and `lg` keep their previous density (4 and 5 columns respectively). Applied via `sed` across all 11 component files in one pass; the loading skeleton in `HomeFeed.tsx` was updated too so it matches the actual grid during fetch.

Did NOT touch: `AdminDashboard.tsx`, `CreatorStudio.tsx`, `LandingPage.tsx` — those use `grid-cols-2` for stat cards / small UI cards, not video thumbnails, and the user didn't report issues with them.

#### Featured and Trending heroes: taller on mobile

**Files:** `HomeFeed.tsx`, `TrendingPage.tsx`

The featured hero on the home page and the #1 trending hero both capped at `42vh` on all viewports. On mobile, a portrait video at `h-[42vh]` (e.g. 336px tall on an 800px viewport) with a 9:16 aspect ratio renders only ~189px wide — centered in a ~400px screen with empty space on both sides, looking "shrunked". The 42vh cap was originally chosen for desktop (to keep the next section visible below the fold on a 1280px viewport), but applying it to mobile too made the hero unnecessarily small.

**Fix:** both heroes now use `h-[60vh] md:h-[42vh]` (portrait/square) and `max-h-[60vh] md:max-h-[42vh]` (landscape). Mobile gets a taller hero; desktop keeps the original 42vh cap. On a typical 800px-tall phone, 60vh = 480px — a portrait video at that height is 270px wide, still narrower than the screen but noticeably larger than before, and a landscape video fills the full width up to 480px tall.

**TrendingPage bonus fix:** the trending hero was still hardcoding `aspect-video` (16:9) regardless of the video's actual format — the same bug v0.5.5 fixed for `HomeFeed.tsx`. A portrait #1 trending video was being `object-cover`-cropped into a 16:9 box, cutting off most of the frame. Refactored to use the same per-format aspect-ratio logic as HomeFeed's Featured hero (`aspect-video` / `aspect-square` / `aspect-[9/16]`) via an IIFE, matching the existing HomeFeed pattern.

---

## Maintenance note — 2026-07-08

**CHANGELOG.md rewritten to remove technical/security detail.** Flagged by Ti: the public, unauthenticated `/changelog` page (added in 0.4.0) had been accumulating implementation-level detail across multiple sessions/agents — API route paths (`DELETE /api/v1/admin/videos/[id]`), ORM/library internals (Prisma match modes, DB constraint types), env var names, and worse, a description of a since-fixed timing-attack vulnerability and a since-fixed public diagnostic endpoint leak. That's a real information-disclosure risk on a page anyone can view without logging in — even for fixed bugs, describing the exact mechanism tells a reader what to go looking for elsewhere in the app.

Rewrote every CHANGELOG.md entry (0.1.0 through 0.6.3) in plain, non-technical language. Verified first that every version already had a matching entry here in DEVLOG.md, so no technical detail was lost — it's just no longer duplicated in the public-facing file. Confirmed the `/api/v1/changelog` parser only depends on the generic `## [version] — date` heading format and `- **bold**` bullets, both preserved, so the public changelog page renders unaffected.

**Versioning correction:** Ti also flagged the 0.5.5 → 0.6.0 jump. That minor-version bump (for the header-decluttering change) wasn't justified under semver — it was the same tier of change as the patch bumps before and after it (0.5.1–0.5.5, 0.6.2, 0.6.3), not a new feature. Already-released versions won't be renumbered (would break the GitHub release tags CHANGELOG.md links to), but going forward: patch bump for fixes/small UI adjustments, minor bump reserved for actual new functionality.

---

## [0.6.3] — 2026-07-08

### Fixed

#### Channel videoCount drift on video deletion (two bugs)

**Files:** `src/app/api/v1/videos/[id]/route.ts`, `src/app/api/v1/admin/videos/[id]/route.ts`

**Bug 1 — user DELETE double-decremented videoCount.** `DELETE /api/v1/videos/[id]` did a `findUnique` (which returns soft-deleted videos), then unconditionally decremented `channel.videoCount`. If the same video was DELETEd twice — e.g. the owner deletes it, then a stale client tab re-issues the request — the count went down by 2 for one video. Over time this could drive `videoCount` negative. Fix: added `video.isRemoved` to the 404 guard (matching the GET route's existing check on line 44), so the second DELETE returns 404 before reaching the decrement.

**Bug 2 — admin DELETE never decremented videoCount.** `DELETE /api/v1/admin/videos/[id]` soft-deleted the video and logged an `AdminAction`, but did not touch `channel.videoCount`. Every admin removal left the channel's count inflated by one (the video is gone from listings but still counted). Fix: the admin route now decrements `channel.videoCount` (guarded by `video.channelId`), and also gets the same `isRemoved` guard to prevent double-decrement if an admin removes a video the owner already deleted.

Both routes now have symmetric behavior: one decrement per actual removal, idempotent on repeated calls.

---

## [0.6.2] — 2026-07-08

### Fixed

#### Username login was case-sensitive ("John" couldn't log in as "john")

**Files:** `src/lib/auth.ts`, `src/app/api/auth/register/route.ts`

**Root cause:** Registration stored the username with its original case — `normalizedUsername = username.toString().trim()` (line 26 of `register/route.ts`) trims but does not lowercase. The credentials provider in `auth.ts` then looked the user up with an exact `username === identifier` match (line 36). Email was already lowercased on both register and login, so email login worked — but a user who registered as "John" and later typed "john" at the login screen got `Invalid email/username or password` with no indication of why.

The Google OAuth path already lowercased usernames (`username.toLowerCase().replace(/[^a-z0-9]/g, '')` in `auth.ts` line 77-80), so OAuth users were unaffected. The bug was isolated to credentials-provider registrations.

**Secondary issue:** the registration uniqueness check (`register/route.ts` line 72) was also case-sensitive, so "John" and "john" could register as two separate accounts. The DB-level `@unique` constraint on `username` is a plain `VARCHAR` unique index in Postgres, which is case-sensitive by default — so the database alone does not prevent this. The application-level check is what enforces case-insensitive uniqueness.

**Fix:** both lookups now use Prisma's `mode: 'insensitive'` filter (supported on the Postgres provider):

- `auth.ts` login lookup: `{ username: { equals: identifier, mode: 'insensitive' } }`
- `register/route.ts` uniqueness check: `{ username: { equals: normalizedUsername, mode: 'insensitive' } }`

No migration needed — `mode: 'insensitive'` is a query-time feature, not a schema change. Existing users with mixed-case usernames can now log in regardless of the case they type.

---

## [0.6.1] — 2026-07-07

### Changed

#### Video cards: visible Bookmark icon instead of everything hidden in "⋮"
**Commit:** `df613d4`

Second item from the Dailymotion comparison list: cards had 5 actions (Save to Watch Later, Add to Playlist, Share, Not Interested, Report) all behind a single unlabeled "⋮" — nothing was reachable without opening a menu first, unlike Dailymotion's exposed Like/Bookmark/Share row.

**Constraint:** this grid is dense (2–5 columns; a card can be ~160px wide), so a full 3-button row like Dailymotion's single-column feed would break the layout at small widths.

**Fix:** `VideoCard.tsx` — added a standalone Bookmark icon button (same visual treatment as the existing "⋮": `bg-zinc-900/70` rounded chip, positioned top-right) that directly calls `onContextMenuAction?.('save', video.id)`, for both the mobile-always-visible menu and the desktop hover-reveal menu. Removed the now-redundant "Save to Watch Later" entry from both dropdown menus, since it's one tap away without opening them. Playlist, Share, Not Interested, and Report remain in the overflow.

---

## [0.6.0] — 2026-07-07

### Changed

#### Header decluttered: theme toggle moved into profile menu
**Commit:** `2985665`

First of a set of polish fixes following a detailed side-by-side comparison against Dailymotion (screenshots from a real device), which surfaced several concrete "messy" issues: an overcrowded header, no creator identity on feed cards, static-only thumbnails, hidden/unlabeled engagement actions, and cramped spacing.

**This fix:** the header had 7 elements on mobile for logged-in users (hamburger, wordmark, search, theme toggle, upload, bell, avatar) vs. ~4 on Dailymotion. Theme is a low-frequency setting, not something that needs permanent top-level real estate. Moved it from a standalone icon button into a new menu item inside the profile dropdown (`Header.tsx`), right below "My Channel" — same toggle behavior (`setTheme`), now also closes the dropdown on click for consistency with the other menu items. Logged-out users still get the standalone icon since they have no profile menu to hold it.

**Remaining items from the comparison** (tracked for follow-up, not yet done): creator identity/follow affordance on feed cards, visible Like/Bookmark/Share actions instead of a hidden "⋮" menu, autoplay/live thumbnail previews, spacing rhythm across sections.

---

## [0.5.5] — 2026-07-07

### Fixed

#### Featured hero cropped portrait videos into a fixed 16:9 box
**Commit:** `f6fd79b`

Reported via a comparison screenshot against Dailymotion: the Featured hero on the homepage looked "squeezed" — a portrait video (two people, full-body shot) rendered with heads and feet both cut off.

**Root cause:** `HomeFeed.tsx`'s Featured section hardcoded `aspect-video` (16:9) on the hero container, with a comment explaining this was chosen to cap the hero's height on desktop (an unconstrained `aspect-video` alone made it ~675px tall on a 1280px viewport). But `VideoCard.tsx` — used everywhere else (Trending grid, shelves) — already picks aspect ratio per-video: `format === 'landscape' ? 'aspect-video' : format === 'square' ? 'aspect-square' : 'aspect-[9/16]'`. The Featured hero was the one place that didn't follow this, and since Vert is portrait-first, most hero videos are portrait — `object-cover` inside a 16:9 box on a 9:16 source crops away most of the vertical frame.

**Fix:** Featured hero now computes `heroAspect` with the same per-format logic as `VideoCard`. Sizing also changed to match: landscape videos stay width-driven (`w-full max-h-[42vh]`, unchanged behavior); portrait/square videos are now height-driven (`h-[42vh] mx-auto` — height fixed, width follows from the aspect ratio, centered) instead of being stretched to full container width. This preserves the original "don't dominate the screen" height cap for every format while showing the correct crop.

---

## [0.5.4] — 2026-07-07

### Changed

#### Category card layout: icon-left, text-right instead of icon-top, text-below
**Commit:** `094d999`

Follow-up to the mobile centering work (0.5.2). Once the grid itself was confirmed centered (pixel-verified: 28px margin both sides on a real device screenshot), the remaining complaint was about the card content itself — icon stacked above title/count, left-aligned, leaving a lot of unused whitespace to the right of the (usually short) text.

**Change:** `ExplorePage.tsx` — both the "with videos" and "No videos yet" category card variants changed from a vertical stack (`<div icon> mb-3` then `<h3>` then `<p>`) to a horizontal flex row (`flex items-center gap-3`): a bigger 48px icon box (`w-12 h-12`, up from `w-9 h-9`; icon itself `h-6 w-6`, up from `h-4 w-4`) on the left, `shrink-0` so it doesn't compress; a `min-w-0` text column to its right containing the title (`truncate` added, since it's no longer full-card-width) and video count/status, vertically centered against the icon via the parent's `items-center`.

Only file using this exact tile pattern (`w-9 h-9 rounded-lg bg-violet-50` / `bg-zinc-100`) — verified via grep before making the change, so no other page needed the same update.

---

## [0.5.3] — 2026-07-07

### Fixed

#### iOS Safari auto-zoom on input focus (search, contact, tag inputs)
**Commit:** `1350e2d`

Continuation of the mobile-optimization pass (0.5.2 fixed centering; this fixes a second mobile-only bug).

**Root cause:** iOS Safari automatically zooms the viewport in when a focused form field's computed font-size is under 16px, as an accessibility measure for readability. Several raw `<input>` elements hardcoded `text-sm` (14px, Tailwind) with no responsive variant: the desktop search bar (`Header.tsx` line 93 — not mobile-visible, but inconsistent), the mobile search overlay input (`Header.tsx` line 224 — **this one is the worst offender, since it also has `autoFocus`, so the zoom fires the instant you tap the search icon**), the `SearchResults.tsx` search bar, both `ContactPage.tsx` name/email fields, and the `UploadPage.tsx` tag-entry input.

Notably, `src/components/ui/input.tsx` (the shared shadcn `Input` component used by `LoginForm`/`SignupForm`) already has the correct fix baked in: `text-base ... md:text-sm` — 16px by default, shrinking to 14px only at the `md` breakpoint and above. Login/signup were never affected. The bug was isolated to components that used a raw `<input>` instead of the shared component.

**Fix:** changed each affected `text-sm` to `text-base md:text-sm`, matching the existing shadcn convention exactly rather than introducing a new pattern. No visual change on desktop; on mobile, inputs are very slightly larger (16px vs 14px) but no longer trigger the zoom.

**Files:** `Header.tsx` (both search inputs), `SearchResults.tsx`, `ContactPage.tsx` (name + email), `UploadPage.tsx` (tag input).

---

## [0.5.2] — 2026-07-07

### Fixed

#### Off-center page content vs header on mobile/narrow viewports
**Commit:** `f3bb555`

Reported via screenshots: the Categories grid (and other pages) appeared shifted left, with more whitespace on the right than the left, on mobile-width viewports.

**Root cause:** `VertApp.tsx`'s app shell renders `<Header>` full-width, outside the scrollable region, then a row containing `<Sidebar>` + `<main className="flex-1 overflow-y-auto ...">`. Page content inside `main` is centered with `max-w-* mx-auto`. On any browser/viewport using a classic (non-overlay) scrollbar — desktop Chrome/Firefox in mobile-emulation mode, some Android WebViews — the scrollbar reserves ~15-17px on the right edge of `main`'s content box. Since `mx-auto` centers content *inside that box*, not inside the full viewport, the visible content shifted left relative to the full-width `Header` above it. Real touch devices with overlay scrollbars (no reserved space) were unaffected, which is why this wasn't caught in earlier manual testing.

**Fix:** `src/app/globals.css` — added `.app-main-scroll` utility (same technique as the existing `.shelf-scroll` class used for horizontal shelves): `scrollbar-width: none` + `::-webkit-scrollbar { width: 0px }`. Applied to `<main>` in `VertApp.tsx`. Scrolling behavior is unchanged; only the always-reserved track space is removed, so centered content now aligns with the header at every viewport width and in every browser.

**Verification:** confirmed against the `ExplorePage.tsx` categories grid (`grid grid-cols-2 sm:grid-cols-3 ... max-w-5xl mx-auto`), which was the component in the reported screenshots. Also separately confirmed the "faded" categories seen in the same screenshots are an intentional empty-state style (muted `bg-zinc-50`/`text-zinc-400` for categories with `videoCount === 0`), not a bug.

---

## [0.5.1] — 2026-07-07

### Fixed

#### Dark mode build fix + UploadPage + anti-flash script
**Commit:** `e769a59`

Post-release audit of the v0.5.0 dark mode work found three issues:

**VideoShelf.tsx — broken JSX (build blocker).** The dark mode commit edited the scroll-arrow button classNames and accidentally dropped the opening `<div` tag on both buttons (lines 59 and 81). What remained was `className="...">` without the element name — a JSX parse error. The build failed with `Type error: Unexpected token. Did you mean {'>'}`. Restored both `<div className="...">` wrappers around the chevron icons.

**UploadPage.tsx — completely missed by dark mode pass.** Audit script found 30 hardcoded light-mode classes (`bg-white`, `text-zinc-900`, `bg-zinc-100`, `border-zinc-200`, etc.) with zero `dark:` variants. The upload form was unreadable in dark mode. Added `dark:` variants to every surface: page heading (`dark:text-zinc-100`), labels (`dark:text-zinc-400`), inputs/textareas (`dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100`), category chips (`dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700`), tag input container (`dark:bg-zinc-800 dark:border-zinc-700`), tag chips (`dark:bg-violet-900/40 dark:text-violet-300`), file drop zone (`dark:bg-zinc-900 dark:border-zinc-700`), thumbnail preview close buttons (`dark:bg-zinc-900/80 dark:text-zinc-300`).

**layout.tsx — anti-flash script didn't handle `theme='system'`.** The pre-hydration inline script reads `localStorage.getItem('theme')` and adds the `dark` class to `<html>` before React hydrates, preventing a flash of light mode. The original logic: `if (theme === 'dark' || (!theme && matchMedia('(prefers-color-scheme: dark)').matches))`. This handled explicit 'dark' and null (first visit with system dark). But next-themes stores `'system'` when the user picks the system option — and `theme === 'system'` didn't match either condition. If a user had `theme = 'system'` and their OS was dark, they'd see a flash of light mode on every page load until React hydrated. Fixed: `if (theme === 'dark' || ((!theme || theme === 'system') && systemDark))` where `systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches`.

**Audit methodology:** ran a script that counted light-mode classes vs `dark:` variants per component file. Found 1 file with zero dark variants (UploadPage) and 2 with partial coverage (SearchSuggestions, TrendingPage — both at ~90% ratio, acceptable). The remaining 38 files all had proper dark: coverage from the v0.5.0 pass.

#### v0.5.0 dark mode release

#### Dark mode support

**Core setup:**
- `src/app/globals.css` — Added `.dark` block with dark OKLCH values. Background: `oklch(0.145 0 0)`, foreground: `oklch(0.95 0 0)`, card: `oklch(0.175 0 0)`, popover: `oklch(0.175 0 0)`, secondary: `oklch(0.25 0 0)`, muted: `oklch(0.25 0 0)`, muted-foreground: `oklch(0.65 0 0)`, border: `oklch(1 1 1 / 10%)`, input: `oklch(1 1 1 / 15%)`, sidebar: `oklch(0.175 0 0)`. Primary, destructive, chart, and ring colors kept same as light for brand consistency. Dark scrollbar thumb added (`oklch(0.3 0 0)`). Sets `--vert-bg-*` and `--vert-text-*` custom vars for non-shadcn elements. The `@custom-variant dark (&:is(.dark *))` was already present before this change.
- `src/app/layout.tsx` — Added `ThemeProvider` from `next-themes` wrapping children (`attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange`). Added flash-prevention inline `<script>` in `<head>` that reads `localStorage.getItem("theme")` before React hydrates, so the correct class is set immediately on page load.
- `src/components/vert/Header.tsx` — Added theme toggle button with Sun icon (`hidden dark:block`) and Moon icon (`block dark:hidden`). Uses `setTheme`/`theme` from `next-themes`. All color classes updated with `dark:` variants.

**Files updated (37 total):**

Shell: `Header.tsx`, `Sidebar.tsx`, `MobileNav.tsx`, `VertApp.tsx`, `Skeleton.tsx`
Auth: `LoginForm.tsx`, `SignupForm.tsx`
Video: `VideoCard.tsx`, `VideoDetail.tsx`, `VideoPlayer.tsx`, `VideoContextMenu.tsx`, `VideoShelf.tsx`
Interaction: `VoteButtons.tsx`, `SubscribeButton.tsx`, `CommentSection.tsx`, `FlagDialog.tsx`, `CategoryBadge.tsx`, `RelatedVideos.tsx`
Pages: `HomeFeed.tsx`, `LandingPage.tsx`, `SearchResults.tsx`, `ChannelPage.tsx`, `ProfilePage.tsx`, `SettingsPage.tsx`, `HistoryPage.tsx`, `SavedPage.tsx`, `TrendingPage.tsx`, `ExplorePage.tsx`, `PlaylistsPage.tsx`, `PlaylistDetailPage.tsx`, `ContactPage.tsx`, `ChangelogPage.tsx`, `TagPage.tsx`, `CategoryPage.tsx`, `NotificationCenter.tsx`, `SearchSuggestions.tsx`, `PlaylistPicker.tsx`

**Design decisions:**
- Used Tailwind `dark:` variant system exclusively (no CSS `@media (prefers-color-scheme: dark)` overrides) for consistency with the class-based theme toggle.
- Active states use `dark:bg-violet-900/30 dark:text-violet-400` — matches the light-mode pattern exactly with inverted backgrounds.
- Dark backgrounds follow a hierarchy: `dark:bg-zinc-950` (page), `dark:bg-zinc-900` (cards/panels), `dark:bg-zinc-800` (hover/secondary), `dark:bg-zinc-700` (avatars/skeletons).
- Text follows a hierarchy: `dark:text-zinc-100` (headings), `dark:text-zinc-200`/`300` (body), `dark:text-zinc-400` (secondary/muted), `dark:text-zinc-500` (placeholders).
- Brand violet kept at same OKLCH values — `oklch(0.546 0.245 262.881)` for `--primary` — ensuring brand colors stay consistent regardless of theme.
- shadcn/ui CSS variable-based components auto-adapt; only hardcoded `zinc-*` classes needed manual `dark:` variants.
- Flash-prevention script runs before React hydrates to avoid a flash of light mode on SSR pages.

---

## [0.4.1] — 2026-07-07

### Changed

#### ESLint config: invalid rules removed, useful rules re-enabled
**Commit:** `b0240a5`

`eslint.config.mjs` — two rule names in the existing config didn't exist in any installed plugin and were silently ignored:
- `@typescript-eslint/no-unused-disable-directive` — this was never a real rule name. The correct name is `@typescript-eslint/no-unused-vars`. ESLint ignores unknown rule names with a warning; `noUnusedDisableDirectives` is a top-level config option, not a rule.
- `react-hooks/purity` — this rule does not exist in `eslint-plugin-react-hooks`. Possibly confused with `react/no-direct-mutation-state` or a linting ideal. ESLint ignored it silently.

Also re-enabled 4 rules that were explicitly set to `"off"`:

1. **`react-hooks/exhaustive-deps: "warn"`** (was `"off"`). Missing deps in `useEffect`/`useMemo`/`useCallback` are a common source of stale-closure bugs. This rule catches them at build time. Set to `warn` so CI doesn't block on missing deps during active development, but contributors see the warning.

2. **`react/display-name: "warn"`** (was `"off"`). Components without display names show as `Anonymous` in React DevTools, making debugging harder. Warn-level so it's non-blocking.

3. **`prefer-const: "warn"`** (was `"off"`). Variables that are assigned once but declared with `let` should be `const` — catches unintended reassignment. Warn-level.

4. **`@typescript-eslint/no-unused-vars: ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]`** (was `"off"`). Unused variables and parameters are dead code and should be removed. The `_` prefix pattern lets you keep destructured params you don't use (common in React event handlers and callback props) by naming them `_event` or `_props`.

Two other rules already at `"off"` were intentionally left unchanged: `no-console` and `no-debugger` — `console.log` is used extensively for debugging in dev, and `debugger` statements are a legitimate workflow. These can be tightened later with a pre-commit hook that strips them from staged files.

#### tsconfig.json: `noImplicitAny` override removed
**Commit:** `b0240a5`

`tsconfig.json` — `strict: true` was set but immediately followed by `noImplicitAny: false`, which overrode the strict-mode default. This meant TypeScript allowed implicit `any` types throughout the codebase, defeating one of the primary benefits of strict mode. Removed the override file-wide.

No type errors were introduced (the project compiled fine before and after), but new code will now require explicit type annotations where TS can't infer them. Over time this raises the type coverage of the codebase.

#### `ARCHITECTURE.md` updated to reflect current state
**Commit:** `68fed94`

`ARCHITECTURE.md` had three stale claims and one misleading description:

- **Database** table said "SQLite (via Prisma)" and described the SQLite prototype. The schema and `prisma/schema.prisma` have used `provider = "postgresql"` since v0.3.0. Updated to reflect PostgreSQL/Neon.
- **Video storage** said "local-filesystem (dev-only)" with the old `public/uploads/` path. The actual implementation uses Vercel Blob for both dev and production since v0.3.0. Updated to match.
- **Routing** trade-off listed "no deep-linkable URLs for videos/channels" with a note "being addressed — see §3". Deep-linkable URLs were already implemented in v0.4.0 with real route files for all views. Updated to describe the actual SPA-on-Next.js architecture where `VertApp.tsx` owns navigation but URLs are synchronized via `viewToPath`/`pathToView`.
- **Known limitations** section mentioned SQLite-specific constraints that no longer apply. Cleaned up.
- **File map** — updated entry for `prisma/schema.prisma` to say PostgreSQL instead of SQLite. Updated `prisma/seed.ts` description. Removed the `public/uploads/` note.

All changes are documentation-only; no logic was modified.

### Added

#### `.env.example` for new contributors
**Commit:** `3edeb27`

`.env.example` — new file at project root documenting every environment variable required or optionally used by the app:

- **`DATABASE_URL`** (required) — Prisma connection string. Documented that serverless pool params are appended automatically by `src/lib/db.ts`, so contributors don't need to add them manually.
- **`PRISMA_DATABASE_URL`** (optional) — direct connection for migrations, needed only when using a pooled URL as `DATABASE_URL`.
- **`NEXTAUTH_SECRET`** (required) — NextAuth JWT signing secret. Included `openssl rand -hex 32` as the recommended generation command.
- **`NEXTAUTH_URL`** (required) — canonical URL for auth callbacks.
- **`GOOGLE_CLIENT_ID`** / **`GOOGLE_CLIENT_SECRET`** (optional) — only needed if Google sign-in should work in local dev.
- **`VERT_BLOB_READ_WRITE_TOKEN`** / **`BLOB_READ_WRITE_TOKEN`** (optional) — Blob store tokens; documented the fallback chain.
- **`SEED_KEY`** (optional) — shared secret for internal endpoints.

The file is ignored by `.gitignore`'s `.env*` pattern. Force-added with `git add -f`. Contributors should copy it to `.env.local` and fill in values.

The `no-console` and `no-debugger` rules remain intentionally disabled — documented in the entry.

---

## [0.4.0] — 2026-07-07

### Added

#### Create test accounts from the admin UI
**Commit:** `adef476`

Admins can now generate test accounts directly from the Users tab without needing shell access to run `prisma/seed.ts`.

**API:** `POST /api/v1/admin/create-test-users` (`src/app/api/v1/admin/create-test-users/route.ts`)
- Admin-only via `requireAdmin()`
- Body: `{ count: number }` — clamped to 1–20, default 3
- Creates N users with:
  - Email: `testuser_<batch>_N@test.vert.com` where `<batch>` is a 5-char base36 timestamp suffix (prevents collisions across repeated calls)
  - Password: `testpass123` (bcrypt-hashed at cost 12)
  - Role: `member` (never admin)
  - `isActive: true`, `emailVerified: true`
  - A channel with a name cycled from a pool of 20 variations ("Test Creator", "Demo Channel", "QA Tester", etc.) and a description noting the batch
- Skips any email that already exists (safety net, shouldn't happen with the timestamp suffix)
- Audit-logged to `AdminAction` with `targetType: 'user'`, `targetId: 'batch'`
- Returns `{ created, users: [{email, username, password, channelName}], note }`

**UI:** `AdminDashboard.tsx` Users tab
- "Create test accounts" button (violet outline, `UserPlus` icon) added next to the role filter
- Clicking opens an inline violet form: a count selector (1, 2, 3, 5, 10, 20) + a Create button
- Explains the password and email pattern up front
- After creation, an emerald result panel shows a table with username / email / password / channel name for each account so the admin can copy them
- The user list auto-refreshes (`fetchAdminUsers(userSearch)`) so the new accounts appear immediately

Use case: QA testing, demo setups, populating the site for screenshots/reviews — without database access.

#### Online presence indicator + Account column rename
**Commit:** `de8786b`

The admin Users tab had a "Status" column showing "active" for every user, which was ambiguous — "active" reads as "online right now" to anyone who isn't the developer. Two changes:

**Renamed "Status" to "Account".** The existing column now has a clearer label — it shows account state (active/suspended badge), not online presence.

**Added "Online" column with live presence dot.** Green dot if `lastSeenAt` is within 5 minutes, gray dot otherwise. Tooltip shows "Last seen X ago" or "Never seen".

Presence tracking implementation:
- `prisma/schema.prisma` — added `lastSeenAt DateTime?` to the User model (nullable so existing rows work without a backfill).
- `prisma/migrations/admin/20260707000001_add_last_seen_at.sql` — `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3)`. Needs to be applied via the admin Database tab or `prisma db push`.
- `src/app/api/auth/session-info/route.ts` — fire-and-forget `db.user.updateMany` that writes `lastSeenAt = now()`. Throttled via a conditional `where` clause: only writes if `lastSeenAt` is null OR older than 60 seconds. This avoids a DB write on every single page navigation — at most one write per user per minute.
- `src/app/api/v1/admin/users/route.ts` — added `lastSeenAt: true` to the Prisma `select`.
- `src/components/vert/AdminDashboard.tsx` — added `lastSeenAt: string | null` to the `AdminUser` interface, added the Online column with an IIFE that checks `(Date.now() - new Date(u.lastSeenAt).getTime()) < 5 * 60 * 1000`. Updated the `<colgroup>` to accommodate 7 columns (was 6). Footer legend updated to explain the dot.

The 5-minute window for "online" is a pragmatic choice — short enough to be meaningful, long enough that a user reading a video page for 4 minutes still shows green. The 60-second heartbeat throttle means at most 1 DB write per user per minute, regardless of how many pages they navigate to.

#### Watch page reorganized by info hierarchy
**Commit:** `881be10`

External Claude product-design review identified the core problem: "the data's all there but nothing's organized by importance — it just cascades top to bottom in the order it was probably added, not the order a viewer actually needs it."

Previous structure: Video → Title → Views/time → Tags (orphan row) → Channel row → Actions → Description (with "..." truncation)

New structure — 6 semantic blocks:
- **Block 1: Video** — constrained to `md:max-w-[380px]` on desktop (was 420px), per review: "keep at native 9:16, capped around 340-380px wide — don't stretch a portrait video wider just because there's room, it'll just look worse."
- **Block 2: Title + tags** — grouped together because both describe what the video IS. Tags previously floated as an orphan row between stats and channel; now sit directly under the title as chips.
- **Block 3: Stats (views/time)** — muted to `text-zinc-400` (was `text-zinc-500`) so they read as quiet supporting metadata, not competing with the title.
- **Block 4+5: Channel + actions** — single row with `border-y border-zinc-200` (top+bottom borders) so it reads as a distinct section. Review: "make sure it reads as one block instead of two floating rows." The borders give it visual containment.
- **Block 6: Description** — own card (`bg-zinc-50 rounded-lg border border-zinc-100`) with a chevron-up/down expand affordance instead of the previous bare "Show more" text link. Categories moved INTO this card (separated by a top border when description exists) since they're part of the "about this video" semantic group.

Desktop layout: right column widened from 300px to 320px for the Up Next queue. Review: "The freed-up space on the right isn't wasted, it's a job the page hasn't given itself yet — an up next queue." The `RelatedVideos` component already serves this role; it's now more prominent as the right rail next to the constrained video.

Mobile: all 6 blocks stack vertically with the new grouping preserved. Video still fills full screen width (Shorts/Reels behavior).

Also removed unused `ArrowLeft` and `Eye` icon imports that were left over from an earlier iteration.

#### Admin Users tab action buttons invisible (table overflow)
**Commit:** `f9181e3`

The admin Users tab had 7 columns (User with avatar, Role, Status, Videos, Comments, Joined, Actions). Verified on the live site: the table's `scrollWidth` was 3205px while the container's `clientWidth` was only 974px. The Actions column (last of 7) was scrolled off-screen to the right. The buttons were in the DOM and visible (26×26px, opacity 1) but physically beyond the viewport — admins literally couldn't see the suspend, promote, or delete buttons without horizontally scrolling the table, and there was no visual hint that they needed to.

Fix: `AdminDashboard.tsx` —
- Dropped the Comments column (comment counts are available in analytics; not critical for user management).
- Removed the avatar from the User cell (was taking ~40px+ including the gap; username + email as text is enough for admin identification).
- Switched from `table-auto` to `table-fixed` with an explicit `<colgroup>`: User 28%, Role 10%, Status 14%, Videos 8%, Joined 12%, Actions 28%.
- The Actions column is now always visible. The three buttons (UserCog for role toggle, UserX/UserCheck for suspend/reactivate, Trash2 for delete) are immediately reachable.

#### Portrait video fills mobile screen; thumbnails respect format
**Commit:** `fd4f0a3`

Two issues from user feedback about portrait video on mobile:

**Portrait player too small.** `VideoPlayer.tsx` — the portrait player was capped at `maxHeight: 55vh` with `maxWidth: calc(55vh * 0.5625)`. On a 390×844 phone that gave a ~261×464px player centered in a 390px-wide screen, leaving ~65px empty margins on each side. YouTube Shorts / Instagram Reels / Facebook Reels fill the full screen width instead.

Fix: portrait player now uses `width: 100%` with no maxHeight cap. The height follows from the `aspectRatio` CSS property (set from `videoAspectRatio` once metadata loads, or `9/16` as fallback via the `format` prop). The watch page scrolls, so title + actions + comments live below the fold — which is the expected behavior for portrait video on mobile (Shorts, Reels, TikTok all work this way).

On desktop, a 9:16 video at 1024px wide (the `max-w-5xl` container) would be 1820px tall — absurdly tall. Added `md:max-w-[420px] md:mx-auto` to the outer wrapper for portrait videos, giving a ~747px-tall player on desktop (tall but reasonable). The `format === 'portrait'` check covers the case where `videoAspectRatio` isn't loaded yet.

Also applied the same wrapper constraint to the error state.

**Portrait thumbnails squished into landscape.** `RelatedVideos.tsx` and `HistoryPage.tsx` — both always used `aspect-video` (16:9) for thumbnails regardless of the video's actual format. Portrait video thumbnails were being object-cover'd into 16:9 boxes, cropping the sides and looking weird.

Fix: both now check `video.format` and use `aspect-[9/16]` for portrait, `aspect-square` for square, `aspect-video` for landscape. The thumbnail width stays fixed (`w-32`); the height follows from the aspect ratio.

`HistoryPage.tsx` — added `format?: string` to the `HistoryEntry.video` interface. The history API already returns `format` (it does `include: { video: { include: { channel } } }` without a `select`, so all video fields come back), it just wasn't typed.

`VideoCard.tsx` — no change needed, it already handled this correctly via `aspectClass`.

#### Account-state route 404s + explore empty state + login error UX
**Commit:** (this commit)

Three fixes from a user-experience review where I signed up as a new user and used the site end-to-end. Real bugs found by actually clicking through flows, not by reading code.

**Account-state route 404s.** `src/app/{upload,profile,admin,history,saved,creator-studio,login,signup}/page.tsx` — these 8 views only existed inside the `VertApp` SPA shell. Navigating to them directly (bookmark, shared link, refresh on a deep-linked URL) hit Next.js's `not-found.tsx` because there was no route file. Created a thin `page.tsx` for each that just renders `<VertApp />`, which parses the URL via `pathToView` and shows the right view.

`src/lib/store.ts` — updated `viewToPath` to return real paths (`/upload`, `/profile`, etc.) instead of `/` for these views, and `pathToView` to parse them back. The `navigate()` store action already pushed the path to history, so browser back/forward and the URL bar now reflect the correct URL for every page. The previous comment "Account-state views stay on the root shell" is no longer true — all views are deep-linkable now.

**Explore page empty categories.** `ExplorePage.tsx` — when most categories have 0 videos (the current state of the live site), the page showed a wall of "No videos yet" cards that made the app feel abandoned. Split into two sections: categories with videos get full-color cards (violet icon bg, dark text, white card bg, hover:border-violet-300) at the top; empty categories collapse into a muted "More categories" section below (gray icon, zinc-50 card bg, light text). Users still discover empty categories but the first impression shows real content.

**Login error friendliness.** `LoginForm.tsx` — the bare "Invalid email/username or password" felt cold (the VLM's emotional reaction: "like a slap in the face"). Added a secondary line: "Check your credentials or create a new account." with a button linking to the signup page, so users who hit a wall have an obvious next step.

#### Homepage density + hero sizing (product-design feedback)
**Commit:** `3daa6df`

External product-design review noted the homepage felt empty despite having a large featured hero — the hero dominated the first screen so users didn't know more content existed below, and the page ended abruptly after the Latest grid.

**Hero height.** `HomeFeed.tsx` + `TrendingPage.tsx` — the hero used bare `aspect-video`, making it ~675px tall on a 1280px viewport (the entire above-the-fold area). Added `max-h-[42vh]` so the hero takes at most 42% of viewport height; the next section's heading is now visible below the fold on typical desktop (800px) and mobile (844px) viewports.

**Hero gradient + text readability.** Strengthened from `from-black/75 via-black/25` to `from-black/90 via-black/40`. Added `drop-shadow-sm` to the title and channel-name text. On bright thumbnails the title was previously hard to read.

**Hero badge.** `bg-violet-600` → `bg-violet-600/80 backdrop-blur-sm`, `text-[10px]` → `text-[9px]`, added `tracking-wider`. The badge now reads as a small label rather than competing with the title for attention. Same treatment applied to the TrendingPage `#1 Trending` badge (`bg-orange-500` → `bg-orange-500/90 backdrop-blur-sm`).

**Popular Creators section.** `HomeFeed.tsx` — new section after Latest. Derives up to 8 unique channels from `[...trendingVideos, ...videos]`, renders each as a 64px circular avatar + name in a horizontally-scrollable row (`overflow-x-auto shelf-scroll`). Avatars get a `ring-2 ring-zinc-100` that transitions to `ring-violet-200` on hover. Fills the dead space that was below the Latest grid and gives the page a more social, alive feel.

**Sidebar defaults.** `Sidebar.tsx` — `categoriesExpanded` and `channelsExpanded` changed from `useState(false)` to `useState(true)`. Collapsed sections looked like empty space and users missed the links.

**Sidebar Creator section.** `Sidebar.tsx` — Creator Studio + Admin Panel moved into a labeled section with a `border-t` divider and a `CREATOR` uppercase heading (`text-[10px] font-semibold text-zinc-400 uppercase tracking-wider`). The hierarchy is now: viewer nav (Home/Explore/Trending/History/Saved/Playlists) → Popular Channels → Categories → CREATOR (Studio/Admin) → footer. Only renders if the user has a channel or is an admin.

#### Remove empty banner space on channel/profile pages
**Commit:** `d0ab347`

The channel and profile pages reserved 96px (mobile) / 144px (desktop) of vertical space for a banner — even when the channel had no banner image. This created a large empty colored box at the top of the page that served no purpose and pushed the actual content down.

A previous fix (`23d02c2`) tried to dress up the empty space with a dotted gradient pattern. That was the wrong call — it decorated the dead space instead of removing it. This commit removes it entirely when there's no banner image.

`ChannelPage.tsx`:
- When `channel.bannerUrl` exists: render the full `h-24 md:h-36` banner with the "Back to feed" button floating on it (unchanged).
- When no banner: skip the banner div completely. The "Back to feed" button becomes a normal inline text link (`text-zinc-500 hover:text-zinc-900`) above the avatar. The avatar sits at the top of the page with no `-mt-8` negative margin (the overlap effect is conditional on `bannerUrl` existing).

`ProfilePage.tsx`:
- Same pattern: banner only renders when `channel.bannerUrl` exists. Without a banner, the avatar sits at the top of the page.

Both pages: the `-mt-8` avatar-overlap-with-banner effect is now conditional on `bannerUrl` existing, so the avatar doesn't get pulled up into nothing when there's no banner.

#### Channel page polish (banner, badge, stats)
**Commit:** `23d02c2`

External visual review (ChatGPT analysis of a channel page screenshot) flagged three issues. Cross-checked each against the live DOM before fixing — the review also claimed "missing video metadata" and "cramped thumbnails" but both were VLM false positives (verified: card text includes title + channel + views + date, cards are 182×386px with gap-4).

**Default banner.** `ChannelPage.tsx` — the fallback for channels without a `bannerUrl` was a flat `bg-gradient-to-br from-violet-100 via-violet-50 to-zinc-100`. Looked like a placeholder. Replaced with a stronger `from-violet-200 via-violet-100 to-zinc-100` gradient + an inline `radial-gradient` dotted pattern (`rgba(124,58,237,0.15)` dots on a 16px grid). The pattern is a CSS `background-image` so no asset files are needed.

**Verified badge.** `ChannelPage.tsx` — was a bare 16px checkmark SVG (`<path d="M9 16.17..."/>`) in `text-violet-600`, no background. Easy to miss as a badge. Replaced with a 20px scalloped-seal SVG (filled `currentColor` body + white check stroke) matching the visual convention of Twitter/YouTube verified badges. Added `aria-label="Verified"` and `role="img"` for screen readers.

**Channel stats row.** `ChannelPage.tsx` — added a `flex flex-wrap gap-4` row below the description with three stat items, each a small line-icon + label:
- Joined date — `channel.createdAt` formatted as "Mon Year" via `toLocaleDateString(undefined, { month: 'short', year: 'numeric' })`.
- Total views — `videos.reduce((sum, v) => sum + v.viewCount, 0)` formatted with `formatViews`.
- Video count — `channel.videoCount` with singular/plural.

Fills the empty whitespace that was below the Subscribe button on desktop and gives the profile a more complete feel.

#### Second visual analysis pass (screenshot-driven)
**Commit:** `70ad72c`

A second screenshot pass after the first round of fixes deployed. Captured 22 screenshots at 390×844 (iPhone 14) and 1280×800 (desktop) across landing, watch, trending, explore, search, changelog, contact, login, and signup pages. VLM (`glm-4.6v`) analysis was cross-checked against DOM measurements to filter hallucinations.

**Landing page card heights.** `LandingPage.tsx` — the landing page uses its own custom card markup (not the shared `VideoCard` component), so the `h-full flex flex-col` fix from the previous pass didn't apply. Verified: cards were 350px vs 370px in the same row. Added the same `h-full flex flex-col` classes to the landing card root.

**Portrait video centering.** `VideoPlayer.tsx` + `VideoDetail.tsx` — the outer player wrapper used `flex justify-start`, so a narrow portrait video (maxWidth ~261px on mobile, ~464px tall) sat left-aligned in a full-width container, leaving all the empty space on the right. Changed to `flex justify-center` in both the player component and the watch page wrapper so the portrait player sits centered horizontally. Whitespace is now balanced left/right.

**Scroll-fade visibility.** `globals.css` — the `.scroll-fade` mask was 16px, too subtle to read as a hint on most screens. Widened to 24px.

**Input height.** `ui/input.tsx` — the shadcn default `h-9` (36px) is below the 40px minimum touch target recommended for mobile forms. Bumped to `h-10` (40px). Affects every form in the app: login, signup, settings (change password, delete account), contact, upload (title, tags), playlist create, playlist picker create.

#### Visual polish pass (screenshot-driven review)
**Commit:** `64b4ec7`

A second UI pass driven by screenshots of the live site at 390×844 (iPhone 14) and 1280×800 (desktop) viewports. The VLM (`glm-4.6v` via `z-ai vision`) was used to spot visual issues across landing, watch, trending, explore, search, changelog, and contact pages. Real issues (filtered from VLM hallucinations) addressed:

**Equal video card heights.** `VideoCard.tsx` — cards in the same grid row had inconsistent heights (verified: 350px vs 370px vs 427px in the same row) because titles have varying lengths and the card root had no height constraint. Added `h-full flex flex-col` to the card root and `flex-1` to the info section. Grid items stretch by default, so `h-full` makes every card in a row match the tallest card. The thumbnail keeps its aspect ratio; the info area grows to fill the remaining height.

**Scroll-fade hint utility.** `src/app/globals.css` — added a new `.scroll-fade` class that applies a `mask-image: linear-gradient(to right, black 0, black calc(100% - 16px), transparent 100%)` to create a subtle 16px fade on the right edge of horizontal scroll containers. This signals "there's more to scroll" without showing a visible scrollbar (the `shelf-scroll` class already hides the native scrollbar). Applied to:
- `SearchResults.tsx` — sort + format + date filter row (verified: 461px content in 358px viewport, no visual hint before).
- `TrendingPage.tsx` — category filter tabs.
- `AdminDashboard.tsx` — top-level tab switcher (Analytics / Flags / Database / Users).

**Smaller portrait video player.** `VideoPlayer.tsx` — reduced the portrait `maxHeight` from `65vh` to `55vh`. At 65vh the player took 548px of an 844px mobile screen, leaving only 296px for title + action buttons + channel info + comments — the user had to scroll immediately to see any context. At 55vh (~464px) the player is still the dominant element but the title + actions + channel row are visible without scrolling. `maxWidth` updated correspondingly to `calc(55vh * 0.5625)` to preserve the 9:16 aspect ratio.

**Landing page footer balance.** `LandingPage.tsx` — the "Vert" wordmark was `text-sm text-zinc-400` (too light, looked like a placeholder). Bumped to `text-sm font-semibold text-zinc-700` so it has visual weight matching the links on the right. Links bumped from `text-zinc-400` → `text-zinc-500` with `hover:text-zinc-900` for better contrast. Hero subtitle spacing improved: `mt-2` → `mt-3 leading-relaxed`.

**Channel name truncation on watch page.** `VideoDetail.tsx` — the channel info `<div>` was `shrink-0`, which meant a long channel name would push the Subscribe button off the right edge of the screen. Changed to `min-w-0` so the name truncates instead. Avatar gets `shrink-0` to preserve its shape. Channel name `max-w` bumped from `8rem/none` → `8rem/12rem` so it truncates gracefully on both mobile and desktop.

#### Mobile-first UI fixes (touch-reachability + safe areas + overflow)
**Commits:** `3e19856`, `3c1abf2`, `0cadb06`, `1848f8d`, `83f47d8`, `93bab41`

A pass over every interactive surface in the app, looking for things that broke on a 360px-wide touch device. Three recurring bug patterns were addressed:

**(a) Hover-only action buttons (`opacity-0 group-hover:opacity-100`).**
On touch devices there is no hover, so these buttons were completely invisible and unreachable. The fix is a consistent pattern: visible by default, hover-reveal only at the `md:` breakpoint (`md:opacity-0 md:group-hover:opacity-100`).

Applied to:
- `VideoCard.tsx` — context menu (MoreVertical) button. Split into two siblings: an always-visible button (`md:hidden`) with larger touch targets (h-4 w-4 icon, p-1.5, w-44 menu) and a hover-revealed one (`hidden md:block`) that keeps the original compact sizing. Added outside-click + Escape handlers (`mobileMenuRef` + `desktopMenuRef`) since on mobile there's no hover-off to dismiss the menu.
- `VideoPlayer.tsx` — controls overlay. Added a `controlsVisible` state toggled by tapping the video element (`handleContainerTap`). The overlay now shows when `controlsVisible` is true OR on hover. Auto-hide after 3s of inactivity while playing (skipped while paused or while the settings menu is open, to avoid trapping the user). All control buttons bumped from `p-1` / `h-4 w-4` to `p-1.5 sm:p-1` / `h-5 w-5 sm:h-4 sm:w-4` for ~32px minimum tap size on mobile. Added `aria-label`s to all control buttons. The big center play overlay now also reveals controls on tap, so the user can immediately reach mute / fullscreen after starting playback.
- `CommentSection.tsx` — delete-own-comment button.
- `HistoryPage.tsx` — remove-from-history X button. Also narrowed thumbnail from `w-40` to `w-32 sm:w-40` (160px was too wide on a 320px screen, leaving only ~96px for title text).
- `SavedPage.tsx` — unsave X button. Also disabled the VideoCard's redundant context menu on this page (both lived in the top-right corner and would overlap on tap).
- `PlaylistsPage.tsx` — delete-playlist trash button.
- `PlaylistDetailPage.tsx` — remove-from-playlist X button.

All buttons also got `aria-label`s that include the item title (e.g. `Remove ${video.title} from playlist` instead of just `Remove from playlist`) for screen-reader users.

**(b) Header rows that overflowed on 360px viewports.**
Avatar + channel name + action buttons all crammed into a single flex row worked on desktop but pushed buttons off-screen on phones. Fixed pattern: stack vertically on mobile (`flex-col`), collapse to row at the `sm:` or `md:` breakpoint.

Applied to:
- `VideoDetail.tsx` — channel + actions row. Now `flex-col md:flex-row`. Channel info + Subscribe on the first row, vote / save / share / flag on the second. Action buttons also `flex-wrap sm:flex-nowrap` so they wrap gracefully on very narrow screens instead of clipping. Avatar bumped from `w-8` to `w-9`. Channel name truncates with `max-w-[8rem] sm:max-w-none` so a long name doesn't push Subscribe off-screen.
- `ProfilePage.tsx` — avatar + name + Studio/Edit buttons. Now `flex-col sm:flex-row`. `self-start` on the avatar keeps the `-mt-8` overlap with the banner looking correct in the stacked layout.
- `ChannelPage.tsx` — avatar + name + Subscribe. Same pattern. Channel name truncates so the verified checkmark stays adjacent to it.
- `PlaylistDetailPage.tsx` — title + Play all + Delete. Same pattern.

**(c) Multi-column tables for content listings.**
On a 360px screen, a 4–5 column table requires horizontal scrolling — the user can only see ~2 columns at a time and has to swipe back and forth to compare title vs. views vs. status. Fixed pattern: render a stacked card list on mobile (`md:hidden`), keep the table on desktop (`hidden md:block`).

Applied to `CreatorStudio.tsx`:
- "Your Videos" table — mobile version shows thumbnail + title + date + format on the first line, views / likes / status badge on the second line.
- "Top 5 Videos" table — mobile version shows title + a single line of "X views · Y likes · Z comments".
- "Recent Uploads" table — mobile version shows title + "X views · Y ago · status badge".

#### Other UI fixes in the same pass

- `TrendingPage.tsx` — ranking badge (`#2`, `#3`, ...) moved from `top-1.5 left-1.5` to `bottom-2 left-2`. The old position overlapped with the VideoCard's `FormatIcon` (also top-left for landscape/square videos). New position avoids overlap with: FormatIcon (top-left), context menu (top-right), duration badge (bottom-right), and watch-progress bar (very bottom edge). Added `pointer-events-none` so taps pass through to the card.
- `SearchResults.tsx` — filter row was `flex-wrap`, which on mobile wrapped Sort + Format + Date into 2–3 awkward lines. Replaced with a single horizontally-scrollable row (`overflow-x-auto` + `shelf-scroll` to hide the scrollbar). Added `shrink-0` to every filter group.
- `NotificationCenter.tsx` — dropdown was `w-80` (320px) with no max-width; on a 360px viewport it could overflow horizontally. Added `max-w-[calc(100vw-1rem)]`. Bumped the mark-all-read and close buttons from `p-1` to `p-1.5` for better tap targets. Added `aria-label`s.
- `AdminDashboard.tsx` — 4-tab switcher (Analytics / Flags / Database / Users) overflowed horizontally on mobile because each tab needs ~80–100px. Made the row scrollable (`overflow-x-auto shelf-scroll`) and added `shrink-0` to each tab.

#### iOS safe-area support
**Commit:** `83f47d8`

- `src/app/layout.tsx` — added a separate `Viewport` export with `viewportFit: "cover"`. In Next.js 13+ this must be a separate export, not inside `Metadata` (the `viewport` field on `Metadata` is deprecated). Without `viewport-fit=cover`, the webview doesn't extend into the notch / home-indicator areas on iPhone X+, so `env(safe-area-inset-*)` returns 0 and the inset padding below has no effect.
- `src/components/vert/MobileNav.tsx` — bottom nav gets `pb-[env(safe-area-inset-bottom)]` so the bar isn't clipped by the iOS home indicator. Side drawer gets `pt-[env(safe-area-inset-top)]` + `pb-[env(safe-area-inset-bottom)]` for the same reason. Active state on bottom-nav buttons changed from `text-zinc-900` to `text-violet-600` to match the brand color used in the desktop Sidebar. The "More" button now highlights when ANY secondary view is active (history, saved, playlists, settings, creator-studio, admin) — previously it only highlighted for `profile` / `login` / `contact`, so the user had no feedback that they were in a section reachable from the drawer.

#### Public changelog page
**Commits:** `1085a0a`, `d80e121`

A new `/changelog` route renders `CHANGELOG.md` to the public web — no auth required. CHANGELOG.md becomes the single source of truth: edit the file, the page updates.

- `GET /api/v1/changelog` (`src/app/api/v1/changelog/route.ts`) — reads `CHANGELOG.md` from disk, parses it server-side with a small inline markdown parser (no dependency added). Handles the Keep a Changelog subset: headings, nested bullet lists, bold/italic, inline code, links (http/https only — no `javascript:`), blockquotes, horizontal rules, paragraphs. HTML-escapes all text first to prevent injection. Cached at the edge for 5 min (`s-maxage=300`).
  - **Redesign (`d80e121`):** the endpoint now returns structured sections instead of a single HTML blob. Each section has `{ version, date, label, id (anchor), html (body) }`. The parser splits `CHANGELOG.md` on `## [version] — date` headers, handles free-form dates (not just `YYYY-MM-DD`), and skips the link-reference lines at the bottom of the file.
- `src/components/vert/ChangelogPage.tsx` — fetches and renders the parsed sections.
  - Sticky left sidebar (desktop, `w-44`) listing all versions with dates. `IntersectionObserver` tracks which section is in view and highlights the corresponding sidebar entry (`violet-50` bg). Clicking a sidebar entry smooth-scrolls to that section.
  - Main content: each version is a section with a violet version badge + date at the top, separated by 12-unit vertical spacing.
  - Mobile: sidebar hidden, version badges show inline at the top of each section.
  - `scroll-mt-20` on sections so the sticky header doesn't cover the section title when navigating via anchor.
  - Empty state + error state with retry.
- `src/app/changelog/page.tsx` — Next.js route entry.
- `src/lib/store.ts` — adds `{ page: 'changelog' }` view type, `viewToPath → /changelog`, `pathToView` regex. Deep-linkable like the other public routes.
- Navigation wired into four surfaces: sidebar footer (ScrollText icon, between Popular Channels and Contact Us, logged-in users only), mobile drawer (same position/icon), landing-page footer (between Vert and Contact), and the public header on `/changelog` and `/contact` (cross-links + Log in / Sign up CTAs).

#### Video player keyboard shortcuts
**Commit:** `b0fa1a3`

`src/components/vert/VideoPlayer.tsx` — player container is now focusable (`tabIndex={0}`) and listens for `keydown` events when focused. Shortcuts:

| Key | Action |
|---|---|
| Space / K | Play / pause |
| ← / → | Seek 5 s back / forward |
| J / L | Seek 10 s back / forward (YouTube-style) |
| ↑ / ↓ | Volume up / down 10% |
| M | Mute / unmute |
| F | Fullscreen toggle |
| 0–9 | Jump to 0% / 10% / … / 90% of the video |

Helpers (`seek`, `changeVolume`, `toggleFullscreen`, `jumpToPercent`) are wrapped in `useCallback` with correct deps. The keydown effect ignores events when the target is an `<input>` or `<textarea>` (so the search box still works). Default-scroll-prevention is scoped to the keys that would otherwise scroll the page (` `, `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`).

Also cleans up two pieces of dead code in the same file: the unused `Film` icon import and the `isSampleVideo` / `demoClicked` demo branch (no route serves `/uploads/sample-*` URLs).

#### Global focus-visible ring
**Commit:** `b59ce86`

`src/app/globals.css` — adds a single rule:

```css
button:focus-visible,
a:focus-visible,
[role="button"]:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  @apply outline-none ring-2 ring-violet-600 ring-offset-2;
}
```

Uses `:focus-visible` (not `:focus`) so the ring only shows for keyboard navigation, not mouse clicks — matches the existing pattern in `VideoCard` and `Header`. Ring color is `violet-600` to match the brand. Components can still override with their own `focus-visible:*` classes.

Resolves the inconsistency flagged in `REVIEW.md` §5 ("Focus rings are present but inconsistent").

### Changed

#### Removed fake comment-like button
**Commit:** `d93d457`

`src/components/vert/CommentSection.tsx` — the per-comment "like" button only updated a local `Set<string>` (`likedComments`), with no API call, no persistence, and a hardcoded display count. Removed:

- `ThumbsUp` import from `lucide-react`.
- `likedComments` state (`useState<Set<string>>`).
- `toggleCommentLike()` handler.
- The like-button + count markup under each comment.

A real comment-like feature would require: a `CommentLike` model in `prisma/schema.prisma`, a `POST /api/v1/videos/[id]/comments/[commentId]/like` endpoint (or a `vote`-style route), a `likeCount` field returned from `GET /api/v1/videos/[id]/comments`, and a denormalized `likeCount` on `Comment` for list-page performance. Deferred — flagged in `REVIEW.md` §UX-8 as resolved (removed rather than wired up).

### Fixed

#### Re-enabled React StrictMode
**Commit:** `543ae9d`

`next.config.ts` — `reactStrictMode: false` → `true`. Was previously disabled without a documented reason. Re-enabling double-invokes certain functions and lifecycle methods in development, which surfaces bugs like the setState-during-render pattern fixed in `e53a129` (see `REVIEW.md` M-8) automatically. No effect in production builds.

Resolves `REVIEW.md` N-1 ("`reactStrictMode: false` — worth investigating").

---

## [0.3.0] — 2026-07-06

### Added

#### Playlists
**Commits:** `38b6824`, `e84197e`, `e766218`

Full playlist CRUD wired to the existing `Playlist` / `PlaylistItem` Prisma models (schema was already there; only API + UI were missing).

- `GET /api/v1/playlists` — lists current user's playlists with `videoCount` and `thumbnailUrl` (first video's thumbnail) via `_count` + `take: 1` include. Avoids N+1.
- `POST /api/v1/playlists` — auto-looks-up `channelId` from session if not provided. Title validation 1–100 chars, description max 1000.
- `GET /api/v1/playlists/[id]` — filters out items whose `video.isRemoved = true`.
- `DELETE /api/v1/playlists/[id]` — owner-only, cascade-deletes items.
- `src/components/vert/PlaylistsPage.tsx` — list + inline create + delete.
- `src/components/vert/PlaylistDetailPage.tsx` — video grid with per-card remove button, Play All, delete playlist.
- `src/components/vert/PlaylistPicker.tsx` — modal from VideoCard context menu. On open, fetches all playlists + checks each for the video (N requests, N typically < 10).
- Deep-link routes `/playlists` and `/playlist/[id]` in `src/lib/store.ts` + Next.js page routes.
- Sidebar + MobileNav get Playlists item (ListVideo icon).

**Known gap:** drag-and-drop reordering not implemented. `position` field exists on `PlaylistItem`.

#### Admin user management
**Commits:** `cf6d3b3`, `e5fb497`

- `GET /api/v1/admin/users` — paginated, search by email OR username (case-insensitive), role filter. Video/comment counts via two `groupBy` queries merged in JS (avoids Prisma 6 filtered `_count` typing issues).
- `PATCH /api/v1/admin/users/[id]` — update `role` or `isActive`. Self-demotion and self-deactivation blocked. Logs to `AdminAction`.
- `DELETE /api/v1/admin/users/[id]` — hard delete. Self-deletion blocked. Requires `{ confirm: true }`. Cascade-deletes via schema. Logs to `AdminAction`.
- Users tab in `AdminDashboard` (4th tab). Search bar, role filter, table with avatar/role/status/counts/join date, per-row action buttons (toggle role, suspend/reactivate, delete).

#### Admin DB migration system
**Commits:** `92a2273`, `7f07654`, `3ade367`, `29df927`, `13bac24`, `48b4522`, `782f6ca`

- `src/lib/migrations.ts` — runner. Reads SQL from `prisma/migrations/admin/`, tracks in `_admin_migration` table, applies each in a `db.$transaction` with the tracking-row INSERT in the same transaction. SQL splitter handles comments + quoted strings. Migration IDs validated against file list (no path traversal).
- `ensureMigrationTable()` runs `CREATE TABLE IF NOT EXISTS` on every call (chicken-and-egg solver).
- `GET /api/v1/admin/db-migrations` + `POST /api/v1/admin/db-migrations/[id]/apply`.
- `next.config.ts` `outputFileTracingIncludes` so SQL files ship in standalone build.
- Database tab in `AdminDashboard` with pending/applied lists, apply buttons, confirm dialog.
- **Bug fix (`782f6ca`):** initial implementation passed `appliedAt.toISOString()` to `$executeRaw`, but `applied_at` is `TIMESTAMP`. Postgres threw `42804`. Fixed by passing the JS `Date` directly.
- CLI: `scripts/apply-admin-migrations.sh` + `db-push.sh`, `db-migrate.sh`, `db-deploy.sh`, `db-status.sh`, `db-studio.sh`.
- SQL files: `20260706000001_create_migration_table.sql`, `20260706000002_watchhistory_unique.sql`, `20260706000003_add_query_indexes.sql`.

#### Account settings
**Commit:** `3a7774f`

- `POST /api/v1/auth/change-password` — requires `currentPassword`, rate limited 5/min/IP, validates new password 6–200 chars and different from current. OAuth users get a clear error.
- `POST /api/v1/auth/delete-account` — requires `{ confirm: true }` + password re-verification for credential users. Rate limited 3/min/IP. Cascade-deletes.
- `src/components/vert/SettingsPage.tsx` — two sections (Change Password, Danger Zone). Multi-step delete confirmation. Deep-link route `/settings`.

#### Search improvements
**Commit:** `048af3b`

- `GET /api/v1/videos` — `search` now matches title OR description OR `channel.channelName` (case-insensitive via `mode: 'insensitive'`). New params: `channel`, `date` (today|week|month|year), `min_duration`, `max_duration`.
- `GET /api/v1/channels/search?q=` — new endpoint. Implemented as a branch in `[id]/route.ts` (when `id === 'search'`).
- `src/components/vert/SearchResults.tsx` rewritten. Two tabs (Videos/Channels), format filter chips, date filter dropdown, all filters trigger re-fetch via `useEffect` deps.

#### Performance
**Commit:** `e9fae0f`

- DB indexes: `Video(isRemoved, status, createdAt)`, `Video(isRemoved, status, viewCount)`, `Video(channelId, isRemoved, status)`, `Comment(videoId, isRemoved, createdAt)`.
- CDN caching: `/api/v1/trending` `s-maxage=60`, `/api/v1/categories` `s-maxage=300`, `/api/v1/tags` `s-maxage=120` (no-cache when `?q=` is set).
- For-you feed refactored to fetch 200 recent + 200 popular (was loading all unwatched videos).
- `next.config.ts` `images.remotePatterns` for `*.public.blob.vercel-storage.com` and `lh3.googleusercontent.com`.

### Changed

- `src/lib/pagination.ts` added — `parsePagination(req, opts)` clamps `page >= 1`, `limit` to `[1, maxLimit]`. Applied to 9 routes.
- `src/app/api/auth/register/route.ts` — email regex + 320-char max + lowercase normalization. Username 3–20 chars, `[A-Za-z0-9_]` only. Password 200-char max.
- `src/components/vert/SignupForm.tsx` — mirrors server-side username rules client-side.
- `src/components/vert/MobileNav.tsx` — Escape key handler + body scroll lock via `useEffect`. Split mislabeled "Watch Later" into History + Saved.
- `src/components/vert/ProfilePage.tsx` + `CreatorStudio.tsx` — auth redirects moved from render body to `useEffect`.
- `src/components/vert/SearchResults.tsx` — stale-closure fix, single effect keyed on `[query, sortBy]`.

### Fixed

- **`9bd62e7`** — SignupForm sent `email` instead of `identifier` to `signIn('credentials', ...)`.
- **`530b6ee`** — Pagination 500s on negative/NaN input. New `parsePagination` helper.
- **`249bdbf`** — `@@unique([userId, videoId])` on `WatchHistory` + `findUnique` + `P2002` handling.
- **`260b918`** — Email format + username rules on register.
- **`2f2c207`** — Video title/description length + URL protocol validation.
- **`d59fb37`** — Channel name/description length + banner URL validation.
- **`9a1f3a2`** — Comment 2000-char cap.
- **`f67b78f`** — `/api/v1/debug-db` locked behind admin auth.
- **`dbabdf5`** — SearchResults stale-closure fix.
- **`e53a129`** — Auth-redirect `setState` moved out of render body.
- **`de78e02`** — Mobile drawer Escape + scroll lock + mislabeled item.
- **`1a68452`** — `/trending` + `/videos/[id]/related` limit clamping.
- **`17fa10c`** — `timingSafeEqual` for `SEED_KEY` comparison.

### Security

- **`137fd17`** — Baseline security headers in `next.config.ts`.
- **`f67b78f`** — debug-db admin-only.
- **`17fa10c`** — timing-safe secret comparison.
- Input validation across register, video/channel/comment creation, URL fields.

---

## [0.2.0] — Earlier 2026

### Added

#### Notifications
**Files:** `src/lib/notifications.ts`, `src/app/api/v1/notifications/*`, `src/components/vert/NotificationCenter.tsx`

- `createNotification()` and `notifyAllAdmins()` — best-effort (errors swallowed).
- Wired to: subscription, comment, like (new OR changed), flag (notifies all admins via `createMany`).
- Self-action guard on all user-facing events.
- `NotificationCenter` rewritten from demo data to live fetch. Polls every 60s. Optimistic updates.

#### Hashtags
**Files:** `prisma/schema.prisma` (Tag, VideoTag), `src/app/api/v1/tags/*`, `src/components/vert/TagPage.tsx`

- `Tag` model: `name` (normalized, unique), `label` (display), `usageCount` (denormalized).
- Upload accepts `tags: string[]`, normalizes, dedupes, caps at 8, upserts, bumps `usageCount`.

#### For You feed
**File:** `src/app/api/v1/feed/for-you/route.ts`

Affinity: +5 shared tag, +3 shared category, +4 subscribed, +2 liked-channel, +1 recency/7d (cap +3), −10 disliked. Excludes watched + own uploads. Cold-start friendly.

#### Deep-linkable routes
**File:** `src/lib/store.ts` (`viewToPath` / `pathToView`)

`/watch/[id]`, `/channel/[id]`, `/category/[slug]`, `/tag/[slug]`, `/search?q=`, `/trending`, `/explore`. Account-state views stay on `/`.

#### Rate limiting
**File:** `src/lib/rate-limit.ts`

In-memory fixed-window counter. Signup 5/min/IP, upload 10/min/user, vote 60/min/user, comment 20/min/user. Needs Upstash Redis / Vercel KV for multi-instance.

#### Prisma client caching
**File:** `src/lib/db.ts`

`globalThis` cache in ALL environments (was dev-only). Lazy `Proxy` wrapper. `withServerlessPoolParams()` appends `connection_limit=1&pool_timeout=10`.

### Changed

- Dependency audit: 44/54 vulns closed. Next.js 16.1.3 → 16.2.9, plus 18 other direct deps. 11 `overrides` for transitive deps.

### Fixed

- `VideoPlayer` side effects isolated in `useEffect` keyed on `videoUrl`.
- Prisma client lazy instantiation prevents import-time crash.

---

## [0.1.0] — Initial release

### Added

#### Video uploads
**File:** `src/app/api/v1/upload/route.ts`

Browser → Vercel Blob direct via `@vercel/blob/client` `put()`. Server generates client token with `generateClientTokenFromReadWriteToken` (content-type allowlist, 200MB max). Bypasses serverless 4.5MB body limit.

#### Video player
**File:** `src/components/vert/VideoPlayer.tsx`

`hls.js` for `.m3u8`. Quality menu from `MANIFEST_PARSED`. `LEVEL_SWITCHED` sync. Progressive downloads show source quality from `videoHeight`. Instance destroyed on URL change + unmount. Portrait capped at 65vh on mobile. Auto-thumbnail backfill via `<canvas>` frame capture.

#### Auth
**File:** `src/lib/auth.ts`

Credentials provider: `identifier` (email OR username) + `password`. Google OAuth with auto-account-creation (username normalized, uniqueness-checked). JWT 30-day. `jwt` callback reloads role from DB. `session-info` reads role/isActive from DB on every request.

#### Core pages
Home feed, trending, explore, categories, search, watch, channel, history, saved, creator studio, admin dashboard. Voting, commenting, subscribing, flagging, saving.

---

[Unreleased]: https://github.com/TisoneK/vert/compare/v0.6.6...HEAD
[0.6.6]: https://github.com/TisoneK/vert/releases/tag/v0.6.6
[0.6.5]: https://github.com/TisoneK/vert/releases/tag/v0.6.5
[0.6.4]: https://github.com/TisoneK/vert/releases/tag/v0.6.4
[0.6.3]: https://github.com/TisoneK/vert/releases/tag/v0.6.3
[0.6.2]: https://github.com/TisoneK/vert/releases/tag/v0.6.2
[0.6.1]: https://github.com/TisoneK/vert/releases/tag/v0.6.1
[0.6.0]: https://github.com/TisoneK/vert/releases/tag/v0.6.0
[0.5.5]: https://github.com/TisoneK/vert/releases/tag/v0.5.5
[0.5.4]: https://github.com/TisoneK/vert/releases/tag/v0.5.4
[0.5.3]: https://github.com/TisoneK/vert/releases/tag/v0.5.3
[0.5.2]: https://github.com/TisoneK/vert/releases/tag/v0.5.2
[0.5.1]: https://github.com/TisoneK/vert/releases/tag/v0.5.1
[0.5.0]: https://github.com/TisoneK/vert/releases/tag/v0.5.0
[0.4.1]: https://github.com/TisoneK/vert/releases/tag/v0.4.1
[0.4.0]: https://github.com/TisoneK/vert/releases/tag/v0.4.0
[0.3.0]: https://github.com/TisoneK/vert/releases/tag/v0.3.0
[0.2.0]: https://github.com/TisoneK/vert/releases/tag/v0.2.0
[0.1.0]: https://github.com/TisoneK/vert/releases/tag/v0.1.0
