# Changelog

All notable changes to Vert are documented in this file, newest first.

> **READ BEFORE ADDING AN ENTRY — for both human contributors and AI agents:**
> This file is rendered on a **public, unauthenticated page** (`/changelog`) —
> anyone can read it without logging in. Write every entry as if explaining
> the change to a normal user who has never seen the codebase and doesn't
> know what an API, a database, or a component is. Describe **what changed
> and why it matters to them** — not how it was built or fixed.
>
> **Do not include, in this file:**
> - File names, function/component names, or code snippets
> - API route paths, database/ORM details, library names
> - Environment variable names or config details
> - Descriptions of *how* a security vulnerability worked, even if it's
>   already fixed — that's a roadmap for anyone looking to attack the app
> - Commit hashes or PR numbers
>
> All of that belongs in [`docs/DEVLOG.md`](./docs/DEVLOG.md) instead, which
> is a plain repo file (not rendered on any public page) meant for whoever
> works on this codebase next. **Every version below should have a matching
> DEVLOG.md entry with the technical detail** — write that one first, then
> write the plain-language version here.
>
> If you're not sure whether a detail is "too technical," a good test: would
> your grandmother understand this sentence? If not, it belongs in DEVLOG,
> not here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

_No unreleased changes yet._

---

## [0.7.0] — 2026-08-11

### Added
- **Shared video links now show a real preview.** When you share a video, channel, or topic link, it now shows the title, a thumbnail, and a short description instead of a blank card — so people can see what they're about to open in messages and social posts.
- **Vert is now easier to find in search engines.** Each video, channel, and topic now has its own proper page details, and the site tells search engines where to find them.

---

## [0.6.25] — 2026-08-08

### Changed
- **Volume controls are easier to use on every device.** Hover or focus the speaker on desktop to adjust volume, while mobile users can tap to reveal the control and tap again to mute or unmute.

---

## [0.6.24] — 2026-08-08

### Changed
- **Light mode now has clearer visual hierarchy.** The page uses a soft canvas, brighter elevated surfaces, stronger boundaries, and subtle depth so sections are easier to distinguish without making the interface feel heavy.
- **Watch pages are easier to scan in light mode.** Video details, comments, Advertisement, and Up Next now read as intentional groups while phones keep the same simple flow.

---

## [0.6.23] — 2026-08-08

### Changed
- **Watch-page actions are easier to scan and use.** Share and Save now explain themselves at a glance, while less-common reporting actions live behind a simple More menu.
- **Comments invite participation more clearly.** Signed-out visitors can go straight to login, signed-in users get a stronger writing surface, and empty conversations keep their compact invitation.
- **Video controls are easier to tap.** Playback, sound, settings, fullscreen, and seeking have roomier targets without overflowing compact players.
- **The watch page feels calmer around discovery.** Advertisement space is quieter and Up Next has a clearer heading with a safe fallback for missing titles.

---

## [0.6.22] — 2026-08-08

### Changed
- **Landscape videos now get a wider desktop watch layout.** The player, video details, and comments share the main column while Advertisement and Up Next remain visible beside them. Portrait and square videos keep their focused three-column layout, and phones keep the same simple stacked flow.

---

## [0.6.21] — 2026-08-08

### Fixed
- **Empty comment sections are more inviting.** The composer now sits closer to the conversation starter instead of leaving a large unexplained gap.
- **Watch-page actions are easier to understand.** Save, share, like, dislike, and sign-in-required actions now provide clearer guidance when you hover or use assistive technology.

### Changed
- **Desktop Up Next shows more recommendations at a glance.** Compact previews use a consistent landscape frame on larger screens, while mobile and tablet previews keep their original video shapes.

---

## [0.6.20] — 2026-08-08

### Fixed
- **Watch pages now use the available desktop space more efficiently.** The video sits closer to the edge and to the surrounding content instead of being surrounded by excessive empty margins.
- **The tighter desktop layout keeps its viewport fit.** The player and Up Next rail remain aligned after the spacing reduction, while phones keep their comfortable spacing.

---

## [0.6.19] — 2026-08-08

### Fixed
- **Portrait watch videos now fit the screen without adding an extra page scroll.** The player keeps its full shape and no longer leaves oversized dark space above or below the video.
- **The Advertisement stays visible while browsing Up Next.** Recommendations now scroll in their own panel instead of moving the ad out of view.

---

## [0.6.18] — 2026-08-07

### Changed
- **Watch pages now use a comfortable three-part desktop layout.** The video stays on the left, the creator profile and comments sit in the middle, and Up Next stays on the right.
- **Portrait videos now fit the visible screen height.** They keep their full shape without becoming taller than the page, while landscape videos continue using the available width.

---

## [0.6.17] — 2026-08-07

### Changed
- **Watch pages now use the desktop screen more effectively.** Portrait videos stay at a comfortable size on the left, while Advertisement, Comments, and Up Next are neatly stacked beside them. Phones keep the same content in a simple vertical flow.

### Fixed
- **Watch-page side content no longer creates confusing nested scroll areas.** The desktop sidebar has one clear scroll surface, and switching videos or comment sorting no longer risks showing stale comment pages.

---

## [0.6.16] — 2026-08-07

### Changed
- **Portrait watch pages now use the desktop screen better.** The player stays readable on the left while Up Next gets its own scrollable rail on the right; phones keep the simpler stacked layout.

### Fixed
- **The video settings button now opens its controls reliably.** Speed and quality choices remain reachable on compact portrait players, and the menu can be dismissed with Escape or by clicking elsewhere.

---

## [0.6.15] — 2026-08-07

### Changed
- **Channel pictures and banners now load more efficiently.** Browsing channels, comments, search results, and creator shelves uses optimized image delivery where supported, while unusual external image hosts keep working normally and broken pictures fall back gracefully.


---

## [0.6.14] — 2026-08-05

### Fixed
- **The side menu now stays closed until you ask for it.** Open it from the menu button when you need navigation, without losing space on the page.
- **The video progress bar now sits neatly inside the player.** It is shorter and inset from the rounded edges, so it no longer runs through the corners.
- **Featured content now looks like a real collection.** The homepage shows several featured picks when available and avoids repeating them in Trending.

---

## [0.6.13] — 2026-08-05

### Fixed
- **Scrollbars are back where scrolling is available.** Long pages and horizontal content rows now make it clearer when more content is available.
- **Progress indicators stay inside their tracks.** Upload, watch-history, and playback progress no longer extend beyond their containers, even at edge values.
- **Video controls respond reliably.** Play, pause, mute, volume, settings, fullscreen, and seeking work through the visible control bar, while keyboard users can seek without accidentally toggling playback.

---

## [0.6.12] — 2026-08-04

### Fixed
- **The watch page no longer repeats the subscriber count.** The count appears once beside the channel name, while logged-out visitors see a clear **Subscribe** button that takes them to sign in.
- **Videos now use the player frame more effectively.** The video content fills the available frame instead of appearing surrounded by unnecessary empty bars.
- **The loading indicator no longer gets stuck over ready videos.** It now appears only while playback is actively waiting for more data, and video errors clear the loading state.

---

## [0.6.11] — 2026-08-04

### Added
- **Videos open faster.** When you hover over a video (or touch it on your phone), Vert quietly starts loading that video's page in the background — so by the time you tap, it's usually ready to watch right away instead of showing a loading placeholder. This works everywhere videos are listed, including the "Up Next" list while you're already watching something.
- **Video pages use less data before playback.** Vert now asks your browser to load only a video's basic details before you press play, reducing wasted data when you open a video but don't watch it.
- **Feeds load lighter.** Video thumbnails and channel pictures that are further down the page now load only as you scroll to them, instead of all at once when the page opens. Browsing uses less data and busy pages feel quicker to appear.
- **Thumbnails load dramatically faster.** Video thumbnails are now automatically shrunk to the size they're shown at and delivered in modern, lighter image formats — often around a tenth of their previous size — with no visible loss in quality. Pages with lots of thumbnails appear much quicker and use far less data, especially on phones.

---

## [0.6.10] — 2026-07-10

A polish pass focused on how the app feels on phones.

### Fixed
- **Opening a new page no longer keeps your old scroll position.** Before, if you scrolled down the home feed and then tapped Trending, the new page opened scrolled partway down instead of at the top.
- **A few violet-tinted elements (video tags, some placeholder avatars and banners) stayed light-colored in dark mode.** They now follow the dark theme.

### Changed
- **Browsing on a phone now shows two vertical videos side by side instead of one giant card per row**, so scanning the feed, search results, channels, and playlists is much faster. Widescreen videos still get the full width of the screen so they stay easy to see.
- **The Explore page shows categories two per row on phones**, so the full list fits on one or two screens instead of a long single-column list.
- **Buttons and video cards now visibly respond when you tap them**, and the side menu and search bar ease in smoothly instead of popping into place. Small touches that make the app feel more alive under your thumb.
- **Loading placeholders now match the shape of the videos that replace them**, so the page no longer jumps around when content finishes loading.

### Added
- **Your account shortcuts are now in the side menu too.** My Channel, Settings, and Sign Out used to be hidden behind the small avatar in the top corner — they're now also in the menu that opens from the "More" tab.

---

## [0.6.9] — 2026-07-10

### Security
- **Channel pages no longer include more account information in their response than they should.**
- **Playlists that are marked private are now actually kept private**, closing a gap that existed before the private-playlists feature was fully wired up.

### Fixed
- **A few more loading placeholders (the gray "skeleton" boxes shown while content loads) stayed light-colored in dark mode.** They now follow the dark theme like the rest of the app.

---

## [0.6.8] — 2026-07-08

### Added
- **The video player now shows a loading spinner when the video is buffering.** Previously, if playback stalled waiting for data to download, the video just froze with no indication that anything was happening. A spinning indicator now appears in the center whenever the video is waiting — during the initial load, when re-buffering after a stall, and when seeking ahead of what's been downloaded.

### Changed
- **The progress bar now shows how much of the video has been downloaded.** A lighter bar behind the violet progress indicator fills up as data loads, so you can see whether skipping ahead will stall or play smoothly.

---

## [0.6.7] — 2026-07-08

### Fixed
- **More dark mode gaps in the admin panel, creator studio, and elsewhere.** The users table header row, the search input, the test-account count dropdown, the creator studio channel summary card and its avatar, the trending page category filter buttons, the comment composer avatar, the load-more-comments button, the search suggestions section label, and the subscribe button (subscribed state) all stayed light-colored in dark mode. All now follow the dark theme.

---

## [0.6.6] — 2026-07-08

### Fixed
- **The admin panel had several surfaces that didn't adapt to dark mode** — warning banners, error and success messages, the database migration cards, the test-account creation form, and the user management badges all stayed light-colored when the rest of the app was dark. These now all follow the dark theme consistently.

---

## [0.6.5] — 2026-07-08

### Fixed
- **On phones, the Creator Studio and Admin Panel were unreachable from the menu.** Both were only listed in the desktop sidebar — the mobile menu had no way to get to them. They now appear in the mobile menu under a "Creator" heading, matching the desktop layout. Creator Studio shows for anyone who has a channel; Admin Panel shows for admins.

---

## [0.6.4] — 2026-07-08

### Fixed
- **On phones, videos were cramped into two narrow columns instead of filling the screen width.** Every video grid (home, trending, explore, search, channel, saved, playlists, etc.) now shows one video per row on mobile, so each thumbnail fills the full screen width — the same way competing video apps display their feeds. Landscape videos in particular were too small to see comfortably; they now fill the screen edge-to-edge. Larger screens keep their existing multi-column layouts.
- **The featured video on the home page and the #1 trending video looked too small on phones.** Both now take up more of the screen on mobile before capping at a smaller height on desktop, so the next section is still visible without scrolling.

---

## [0.6.3] — 2026-07-08

### Fixed
- **Channel video counts could drift slightly out of sync**, especially after an admin removed a video. Counts now stay accurate.

---

## [0.6.2] — 2026-07-08

### Fixed
- **Logging in with a username was case-sensitive**, so someone who registered as "John" couldn't log in by typing "john". Username login now works the same way email login already did — case doesn't matter.

---

## [0.6.1] — 2026-07-07

### Changed
- **Video cards now show a Save/Bookmark button directly** instead of hiding every action behind a single "more options" menu — the most common action is one tap away.

---

## [0.6.0] — 2026-07-07

### Changed
- **Simplified the header for signed-in users.** Moved the theme toggle into the profile menu to reduce clutter in the top bar.

---

## [0.5.5] — 2026-07-07

### Fixed
- **Featured videos on the homepage could look oddly cropped** when the video was portrait-oriented. The featured video now displays in its correct aspect ratio.

---

## [0.5.4] — 2026-07-07

### Changed
- **Category cards on the Explore page were redesigned** — a larger icon on the left with the title and video count beside it, for a cleaner, easier-to-scan layout.

---

## [0.5.3] — 2026-07-07

### Fixed
- **On iPhone, tapping the search bar (and a few other text fields) unexpectedly zoomed in the whole page.** Fixed — typing now feels normal.

---

## [0.5.2] — 2026-07-07

### Fixed
- **On some mobile browsers, page content (like the Categories grid) appeared shifted left instead of centered.** Pages now stay properly centered at every screen size.

---

## [0.5.1] — 2026-07-07

### Fixed
- **A bug introduced in the dark mode update briefly broke the site.** Resolved.
- **The upload page didn't support dark mode** and was hard to read. Fixed.
- **Dark mode could flash the wrong color briefly when a page first loaded.** Fixed.

### Added
- **Dark mode support**, following your device's setting or a manual toggle, across the entire app.

---

## [0.4.1] — 2026-07-07

### Added
- **Clearer setup instructions** for anyone running their own copy of the project.

### Changed
- **Internal code-quality tooling improvements**, and documentation updated to reflect the current technology stack.

---

## [0.4.0] — 2026-07-07

### Added
- **Admins can create test accounts directly from the admin dashboard**, without needing developer access.
- **Admins can see which users are currently online** in the Users tab.
- **A new "Popular Creators" row on the homepage** highlights active channels.
- **Video controls are now reachable on touchscreens** by tapping the video, not just by hovering with a mouse.
- **The app now properly respects the notch and home-indicator area on iPhone.**
- **Horizontally-scrolling rows (filters, tabs) now hint that there's more content** with a subtle fade at the edge.
- **Added a public Changelog page** so anyone can see what's new.
- **Added keyboard shortcuts for video playback** — play/pause, seek, volume, fullscreen, and jumping to a percentage of the video.
- **Improved keyboard accessibility** with visible focus outlines throughout the app.

### Changed
- **Clarified "online now" vs. "account active"** in the admin dashboard, which were previously combined in a confusing way.
- **Reorganized the watch page** for a more natural reading order, and resized the portrait video player for a better fit.
- **Portrait videos now fill the screen on mobile**, the same way Shorts/Reels do.
- **Portrait video thumbnails no longer look stretched or squished.**
- **Homepage featured videos are less overwhelming in height.**
- **Featured video text is easier to read** over bright thumbnails.
- **Badges on video cards are smaller and less distracting.**
- **Sidebar sections are expanded by default** instead of looking empty.
- **Creator and Admin tools now have their own clearly labeled section** in the sidebar.
- **Channel and profile pages no longer show an empty gray box** when there's no banner image.
- **The verified checkmark badge now matches familiar conventions** used elsewhere.
- **Channel pages now show join date and total views.**
- **The portrait video player is better sized on mobile**, so page content isn't pushed too far down.
- **Portrait videos are now centered on the watch page** instead of sitting off to one side.
- **Form fields are slightly taller** for easier tapping on mobile.
- **Removed a "like" button on comments that didn't actually do anything**, to avoid a misleading experience. A real version of this feature is planned.
- **Creator dashboard tables are easier to use on mobile.**

### Fixed
- **Admin action buttons (suspend/promote/delete) were impossible to see on some screens.** Now always visible.
- **Several pages returned a "not found" error** when visited directly or refreshed; they now work correctly as normal pages.
- **The Explore page no longer looks empty** when some categories don't have videos yet.
- **The login error message is friendlier** and points toward signing up.
- **Video cards in the same row now line up evenly in height.**
- **Long channel names no longer overlap the Subscribe button.**
- **Minor footer alignment fix on the landing page.**
- **Several action buttons (comments, history, saved videos, playlists) were invisible on touchscreens.** Now visible on mobile.
- **Some pages required horizontal scrolling on small phones.** Fixed.
- **A ranking badge no longer overlaps another icon on video cards.**
- **Horizontally-scrolling filter/tab rows no longer wrap awkwardly on mobile.**
- **The notification panel no longer overflows on very small screens.**

---

## [0.3.0] — 2026-07-06

### Added
- **Playlists** — create, view, edit, delete, and add videos to them.
- **Admin tools for managing user accounts** — search, change roles, suspend, or delete, with safeguards against locking yourself out.
- **Admins can apply routine maintenance updates directly from the dashboard.**
- **Users can change their password or delete their own account** from a new Settings page.
- **Search now also matches channel names**, with a dedicated Channels tab in results.
- **Search can be filtered by video orientation and upload date.**
- **General security and performance hardening behind the scenes.**

### Changed
- **Search is now case-insensitive.**
- **The personalized "For You" feed loads faster and more reliably.**
- **New accounts are automatically logged in right after signup.**
- **Registration is validated more strictly** to keep account data clean.
- **Mobile navigation drawer improvements** — Escape closes it, clearer menu labels.
- **Internal documentation reorganized.**

### Fixed
- **New-account signup no longer failed to log users in.**
- **Some pages could error out with unusual page-number inputs.** Fixed.
- **View counts could occasionally be counted twice.** Fixed.
- **Minor internal warnings on the Profile and Creator Studio pages resolved.**
- **Search results now update properly when you search again.**

### Security
- **Strengthened protections against malformed input and a few common web vulnerabilities.**
- **Closed off an internal diagnostic page that shouldn't have been publicly reachable.**
- **Hardened an internal security check.**

---

## [0.2.0] — Earlier 2026

### Added
- **Notifications** for subscriptions, comments, likes, and flags.
- **Hashtags** — add up to 8 tags to a video, with dedicated tag pages.
- **A personalized "For You" feed** on the homepage.
- **Every video, channel, category, tag, and search now has its own shareable link.**
- **Rate limiting** added to reduce spam and abuse on signup, uploads, voting, and comments.
- **Added internal architecture documentation for the project.**

### Changed
- **Updated dependencies to close a large number of known security vulnerabilities.**

### Fixed
- **Video playback no longer restarted unexpectedly** when using player controls.
- **Fixed a rare crash during first-time setup.**

---

## [0.1.0] — Initial release

### Added
- **Video uploads** (MP4, WebM, MOV up to 200MB) with automatic thumbnails.
- **A full-featured video player** with adaptive quality and mobile-friendly sizing.
- **Sign in with email/username + password, or Google.**
- **Core pages:** home, trending, explore, categories, search, watch, channel, history, saved, creator studio, and admin dashboard.
- **Voting, commenting, subscribing, flagging, and saving videos.**
- **An admin dashboard** with analytics and moderation tools.

---

[Unreleased]: https://github.com/TisoneK/vert/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/TisoneK/vert/releases/tag/v0.7.0
[0.6.25]: https://github.com/TisoneK/vert/releases/tag/v0.6.25
[0.6.24]: https://github.com/TisoneK/vert/releases/tag/v0.6.24
[0.6.23]: https://github.com/TisoneK/vert/releases/tag/v0.6.23
[0.6.22]: https://github.com/TisoneK/vert/releases/tag/v0.6.22
[0.6.21]: https://github.com/TisoneK/vert/releases/tag/v0.6.21
[0.6.20]: https://github.com/TisoneK/vert/releases/tag/v0.6.20
[0.6.19]: https://github.com/TisoneK/vert/releases/tag/v0.6.19
[0.6.18]: https://github.com/TisoneK/vert/releases/tag/v0.6.18
[0.6.17]: https://github.com/TisoneK/vert/releases/tag/v0.6.17
[0.6.16]: https://github.com/TisoneK/vert/releases/tag/v0.6.16
[0.6.15]: https://github.com/TisoneK/vert/releases/tag/v0.6.15
[0.6.14]: https://github.com/TisoneK/vert/releases/tag/v0.6.14
[0.6.13]: https://github.com/TisoneK/vert/releases/tag/v0.6.13
[0.6.12]: https://github.com/TisoneK/vert/releases/tag/v0.6.12
[0.6.11]: https://github.com/TisoneK/vert/releases/tag/v0.6.11
[0.6.10]: https://github.com/TisoneK/vert/releases/tag/v0.6.10
[0.6.9]: https://github.com/TisoneK/vert/releases/tag/v0.6.9
[0.6.8]: https://github.com/TisoneK/vert/releases/tag/v0.6.8
[0.6.7]: https://github.com/TisoneK/vert/releases/tag/v0.6.7
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
