# Current Task (overwrite each session)

Holds exactly one task — the one being worked on right now. Set it at
session start (protocol Step 3), clear it at session end (Step 15). If
you find a stale in-progress entry here, a prior session died mid-task —
check its session entry and backlog before starting.

<!-- TEMPLATE — replace everything below this comment:
- **Session:** YYYY-MM-DD — <agent> / <model>
- **Task:** <what is being worked on right now>
- **Status:** in-progress | done | blocked (<blocker>)
-->

- **Session:** —
- **Task:** none — no session in progress
- **Status:** idle

<!-- Last session: 2026-07-14 (Session 3, Claude Code / claude-fable-5) —
general sweep: fixed non-string-body-field 500s (a27d338), closed backlog
[L-2] seed/cleanup Prisma singleton (59f23da). Done. See
.context/reviews/2026-07-14-review.md and tasks/backlog.md. -->
