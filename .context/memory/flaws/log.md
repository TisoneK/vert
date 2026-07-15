# Flaws Log (append-only — flows to the protocol package)

Friction caused by the `.context/` system or the protocol itself. See
`README.md` in this directory for the split between `flaws/` and
`inefficiencies/`.

<!-- TEMPLATE — copy below the last entry:
---
## YYYY-MM-DD — <agent> / <model> (Session N)

- **Flaw:** <what in the protocol or .context/ system didn't work>
- **Symptom:** <what happened to the agent — the observable friction>
- **Root cause:** <why the protocol/.context/ let this happen>
- **Suggested fix:** <concrete change to the package — a step, a pitfall,
  a template, a rule>
- **Status:** open | fixed in package <commit-sha or date>
-->

---
## 2026-07-11 — Claude Code / claude-opus-4-8 (Session 1)

- **Flaw:** The universal kickoff (`vert-kickoff.md`) Step 0 is written for a
  cloud/sandbox agent that must clone the project repo into a workspace. A
  local IDE agent is *already inside* the cloned repo, so "clone the project
  repo" (Step 0b) is a no-op that can confuse the agent about where to work.
- **Symptom:** Had to reconcile the kickoff's clone-based flow against the
  local protocol edition (which correctly says "repo is already local, don't
  clone"). Minor — resolved by deferring to the local edition and only cloning
  the `.context-package` sibling.
- **Root cause:** One kickoff file serves both editions; its Step 0 assumes the
  cloud flow and doesn't branch on "local agent, repo already present."
- **Suggested fix:** In the package kickoff, add a short "If you are a local
  agent already inside the repo, skip Step 0b (project clone) — only clone the
  `.context-package` sibling and cd into the existing repo" note at the top of
  Step 0.
- **Status:** fixed in package `f261b70` (2026-07-11) — `universal-kickoff.md`
  committed to `TisoneK/.context` with Step 0 branched Local vs Cloud/sandbox,
  every PAT/`GIT_TOKEN` reference marked cloud-only, a shared `0c. Verify` +
  `../.context-package` path-normalization note, refined model-identity
  guidance, and a Local-repo-path Pre-Flight field. The Desktop copy handed to
  this session was corrected in lockstep. Reported and fixed in the same
  session (Session 1). See package `flaws/log.md`, 2026-07-11.
