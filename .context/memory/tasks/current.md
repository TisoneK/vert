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

- **Session:** 2026-08-04 — Claude Code / claude-opus-4-8 (Session 11)
- **Task:** feature — **Image Optimization**. Compress image file sizes + convert to next-gen formats (WebP/AVIF) so pages load fast without losing quality. Directly addresses the Session 10 diagnosis (445KB PNG thumbnails via plain `<img>`, no next/image, are a main cold-load cost on the live site). Role: feature-engineer.
- **Status:** in-progress
