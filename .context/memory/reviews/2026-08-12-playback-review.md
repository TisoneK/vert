# Vert — Watch-page playback (Session 44)

- **Date:** 2026-08-12
- **Agent:** Claude Code / claude-opus-4-8 (local, Baos-Mac-mini)
- **Role:** feature-engineer
- **Request:** user asked for autoplay on open, auto-advance to Up Next on end, autoplay when
  clicking Up Next, loop/repeat, persistent volume, and poster-first playback.

## Decision (one clarification asked)

Points #2 (auto-advance on end) and #4 (loop/repeat) conflicted on "video ended." Asked the owner
once → **advance to next if there is one, loop if it's the last.** Everything else was
unambiguous. Design = **ADR-31**.

## Shipped — `0.9.0` (commit `1fa5c10`, tag `v0.9.0`)

- **Autoplay on open** (`VideoPlayer.autoPlay`): plays on `canplay`; tries sound first (SPA card
  click = user gesture in the same document), mutes + retries if blocked — transient, not persisted.
- **Auto-advance / loop-if-last** (`VideoPlayer.loop` + `onEnded`): `VideoDetail` computes the next
  video from the shared `['related-videos']` query and passes `loop={!nextVideo}` +
  `onEnded={navigate(next)}`.
- **Persistent volume/mute**: new `usePlayerPrefs` zustand store (localStorage `vert:player-prefs`);
  `VideoPlayer` seeds from it on mount and writes explicit changes back.
- **Poster-first**: `<video poster>` already renders first; autoplay starts independently of the
  Up Next / comments skeletons.

## Verification (live on the deploy)

- tsc 0 / eslint 0 / `next build` exit 0 (machine memory recovered — build ran in 14s).
- Live: autoplay `paused:false` playing with sound; `loop:false` (Floor has a next); after setting
  `vert:player-prefs` volume `0.25` and reloading, the player applied **volume 0.25**; seeking to
  the end auto-advanced (`advanced:true`, navigated to the next `/watch/<id>`).

## Notes

- On a direct page load with no prior gesture, playback starts **muted** until the viewer unmutes
  (browser autoplay policy — unavoidable); arriving via a card click plays with sound.
- Player volume/mute is now owned by `usePlayerPrefs`; don't persist the transient autoplay-mute.
