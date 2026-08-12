# Current Task (overwrite each session)

- **Status:** in-progress
- **Session:** 43 (2026-08-11)
- **Agent:** Claude Code / claude-opus-4-8 (local, Baos-Mac-mini)
- **Role:** feature-engineer
- **Task:** C1 — add Terms of Service + Privacy Policy pages (server-rendered routes, crawlable,
  theme-aware) + footer links (landing footer) + a "by signing up you agree…" note on signup.
  Draft content accurate to the app's behavior; owner must review with counsel before launch.
  Implements production-feel review [C1].
- **Part of:** production-polish run (S41 P1 done, S42 P3 done / P2 deferred, S43 C1).
- **Env note:** local `next build` blocked by machine memory pressure — rely on tsc+eslint +
  Vercel cloud build; legal pages are server-rendered so verify via `curl /terms` and `/privacy`.
