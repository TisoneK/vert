# Session Notes: 2026-08-01 — Session 7

<!-- Append-only while this session's directory is alive. Detail that
would otherwise bloat the global logs or the compact session summary:
research findings, attempted approaches, dead ends, implementation
reasoning, intermediate observations. Facts that outlive the session
belong in their persistent domain (see sessions/README.md).

TEMPLATE — copy below the last entry:
---
## YYYY-MM-DD — <agent> / <model> (Session N)
<findings, attempts, dead ends — session-scoped detail.>
-->

---
## 2026-08-01 — Buffy / deepseek-v4-flash (Session 7)
- **Task:** Sync `.context` — the standing maintenance target. Result:
  vendored core **0.3.0 → 0.5.0**, entry-point files regenerated,
  sessions module adopted.
- **Core update (0.3.0 → 0.5.0, two releases):**
  - **0.4.0 (Windows release):** new `core/bin/context-sync.ps1` —
    PowerShell port of status/verify/update/rollback/lock; byte-compatible
    with the sh tool's MANIFEST (identical SHA-256, forward-slash paths).
    macOS/Linux behavior unchanged.
  - **0.5.0 (session-scoped memory release):** new `memory/sessions/`
    module (SUMMARY.md = prunable one-liners; `<date>-N/notes.md` =
    disposable detail). New Step 17 "Context Promotion" — durable facts
    move to domain files so deleting a session can't delete knowledge.
    Reading order now includes skimming `sessions/SUMMARY.md` last ~10
    entries. Session entries in `agents/sessions.md` gain `Core:`
    (version) and `Notes:` (path or "none") fields.
  - Migration from 0.4.x: none required — module appears on first use.
- **What I changed:**
  - `git pull --ff-only` → already up to date (remote had only dependabot
    branch refs; no main movement).
  - `context-sync update` (0.3.0 → 0.5.0) + `verify` clean. `core.lock`
    bumped by the tool.
  - Regenerated `.context/kickoff.md` + `AGENTS.md` from the new
    templates (kickoff template gained Windows `.ps1` invocation notes +
    the sessions-skim line in Step 2; AGENTS template gained the sessions
    skim in rule 4). Project facts unchanged (repo public, main, Vercel,
    identity Tisone Kironget).
  - Created `memory/sessions/` (README.md, SUMMARY.md seeded with
    Sessions 5–7 one-liners, this notes file).
  - Updated `system/ai-models.md` (Buffy/deepseek-v4-flash row) and
    `environments.md` (last-verified date + stale eslint-baseline quirk
    corrected: baseline is now 0, CI lint blocking — no longer "35
    pre-existing errors").
- **Environment facts confirmed:** Baos-Mac-mini, macOS 15.7.7 (Darwin
  24.6.0), user `bao`, git identity Tisone Kironget
  <tisonkironget@gmail.com>. Node/npm only (no bun).
- **No inefficiencies of note this session** — the sync path is smooth
  and well-documented. Model id `deepseek-v4-flash` comes from the
  system prompt (recorded, not guessed).
