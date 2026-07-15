# Active Workflow (overwrite when the workflow changes)

The workflow currently in force for this repo — which protocol edition
agents follow and the standing session parameters. Update only when the
user changes the rules; note the change in your session entry.

<!-- TEMPLATE — replace everything below this comment:
- **Protocol:** by agent type — local agents → .context/core/rules/ai-engineering-protocol-local.md; cloud/sandbox agents → .context/core/rules/ai-engineering-protocol.md
  <!-- ALWAYS record it exactly like that — "by agent type", naming BOTH.
  NEVER record only the edition YOU happen to be: the next agent on this
  project may be the other type, will read this field as binding, and
  will inherit your platform's behavior (a local agent doing cloud PAT
  dances, or a cloud agent skipping its clone). The edition is a
  per-agent-type fact, not a project fact. -->
- **Protocol location:** on disk — vendored in `.context/core/` (no network fetch needed; version in `.context/core/VERSION`, last verified in `../core.lock`)
- **Package upstream (for flaw back-ports + core updates):** <https://github.com/TisoneK/.context.git or fork/mirror URL>
- **Since:** YYYY-MM-DD
- **Default role:** <e.g., engineer — unless a session says otherwise; see .context/core/roles/>
- **Scope:** <e.g., discovery + review + fix all safe issues>
- **Target:** <general sweep | refactor <path> | fix <bug> | feature <description> | review <area> | free text>
- **Focus areas:** <e.g., all — security, performance, UX, architecture, testing, docs>
- **Findings handling:** <e.g., fix safe, flag architectural>
- **Push policy:** <e.g., push to main directly after each commit>
- **Commit style:** <e.g., Conventional Commits with scope; chore(context): for this directory>
- **Commit granularity:** <e.g., one logical change per commit>
- **Deliverable:** <e.g., report in .context/memory/reviews/ + chat summary>
-->

- **Protocol:** by agent type — local agents → `.context/core/rules/ai-engineering-protocol-local.md`; cloud/sandbox agents → `.context/core/rules/ai-engineering-protocol.md`
- **Protocol location:** on disk — vendored in `.context/core/` (no network fetch needed; version in `.context/core/VERSION`, last verified in `../core.lock`)
- **Package upstream (for flaw back-ports + core updates):** https://github.com/TisoneK/.context.git
- **Since:** 2026-07-11 (migrated to vendored core 0.2.0 on 2026-07-15)
- **Default role:** engineer (full-scope) — unless a session hands over a role overlay from `.context/core/roles/`
- **Scope:** discovery + review + fix all safe issues
- **Target:** general sweep (session default; a chat-message target overrides)
- **Focus areas:** all — security, performance, UX, architecture, testing, docs
- **Findings handling:** fix safe issues; flag architectural changes for approval
- **Push policy:** push to main directly after each commit
- **Commit style:** Conventional Commits with scope; `chore(context):` for this directory
- **Commit granularity:** one logical change per commit
- **Deliverable:** report in `.context/memory/reviews/YYYY-MM-DD-review.md` + chat summary
