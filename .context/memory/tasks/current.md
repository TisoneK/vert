# Current Task (overwrite each session)

- **Status:** in-progress
- **Session:** 35 (2026-08-11)
- **Agent:** Claude Code / claude-opus-4-8 (local, Baos-Mac-mini)
- **Role:** feature-engineer — implementing ADR-26 (owner approved this turn)
- **Task:** Crawlable/accessible navigation — content cards render as real `<a href>`
  (VideoCard, RelatedVideos, LandingPage) with onClick → preventDefault + navigate (keeps
  zustand SPA nav, adds crawl/keyboard/open-in-new-tab). Resolve nested-button issue.
  Implements review 2026-08-11 [M1], ADR-26.
- **Part of:** autonomous grouped implementation of the 2026-08-11 review (S34…S39).
