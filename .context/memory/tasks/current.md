# Current Task (overwrite each session)

- **Status:** in-progress
- **Session:** 42 (2026-08-11)
- **Agent:** Claude Code / claude-opus-4-8 (local, Baos-Mac-mini)
- **Role:** feature-engineer
- **Task:** Watch-page production polish — P3: hide the "ADVERTISEMENT — Reserved placement"
  stub until there's real inventory (collapse-when-empty). P2: reduce the large empty desktop
  void below sparse comments. Implements production-feel review [P3]/[P2].
- **Part of:** production-polish run (S41 P1 done, S42 P2/P3, S43 C1 legal pages).
- **Env note:** local `next build` unreliable (machine memory pressure) — lean on tsc+eslint +
  Vercel cloud build; verify deploy via `curl /api/v1/changelog`.
