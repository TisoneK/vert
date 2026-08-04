# Watch-Page UX Review — 2026-08-04 (Session 14)

- **Agent:** Buffy | **Model:** openai/gpt-5.6-luna | **Platform:** Baos-Mac-mini (macOS 15.7.7, Darwin 24.6.0) | **Role:** engineer | **Core:** 0.5.0
- **Target:** Fix duplicate subscriber labeling, player framing, and stuck buffering UI.

## Findings

Live baseline reproduction on the public watch page confirmed:

- Logged-out visitor state showed the channel count in metadata and the same
  `1 subscriber` value inside the non-interactive subscribe button.
- The deployed video element used `object-contain`; the reported oversized black
  frame was consistent with UI-level letterboxing when the frame and content
  ratios differ.
- The public MP4 was healthy: `video/mp4`, byte-range support, CORS enabled,
  `Content-Length: 2,134,092`, and no browser media error. The live browser
  reported `readyState: 4`, paused, no spinner, and no console errors at the
  inspection moment. The stuck-spinner report was therefore addressed as a
  player-state edge case rather than a broken Blob response.

## Changes

- Logged-out `SubscribeButton` is now an outline `Subscribe` CTA that routes to
  login; the subscriber count remains only beside the channel name.
- Removed the obsolete count prop/state from `SubscribeButton` and both call sites.
- Video/channel APIs return boolean `isSubscribed`; viewer identity is included
  in React Query keys and hover prefetch keys so anonymous and authenticated
  results cannot collide.
- Subscribe controls remount on viewer/server-state changes without a
  `set-state-in-effect` lint violation.
- `VideoPlayer` uses `object-cover`, starts without a false initial buffering
  state, clears loading on metadata/error/HLS fatal error, and renders its spinner
  only while active playback is waiting for data.
- Updated the player comment to distinguish initial readiness from rebuffering.

## Validation

- `npx tsc --noEmit` — exit 0.
- `npx eslint .` — exit 0; 0 errors and 19 warnings.
- `npx next build` — exit 0.
- `git diff --check` — exit 0.
- Changelog parser/version smoke test recognized `Unreleased`, `0.6.12`,
  `0.6.11`, and `0.6.10`; package version is `0.6.12`.
- Live baseline browser inspection had no console errors. Post-release browser
  verification remains a useful follow-up because the live page was inspected
  before the new commit deployed.

## Release

Published in commit `05cb8ff` as `0.6.12`, with annotated tag `v0.6.12` pushed
per ADR-7. The source-frame caveat remains: CSS cannot remove black bars baked
into a video asset; `object-cover` addresses the player-frame presentation.
