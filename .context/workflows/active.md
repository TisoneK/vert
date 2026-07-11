# Active Workflow (overwrite when the workflow changes)

The workflow currently in force for this repo — which protocol edition
agents follow and the standing session parameters. Update only when the
user changes the rules; note the change in your session entry.

<!-- TEMPLATE — replace everything below this comment:
- **Protocol:** <ai-engineering-protocol.md (cloud) | ai-engineering-protocol-local.md (local) | both, by agent type>
- **Protocol source (raw — for agent fetch):** <https://raw.githubusercontent.com/TisoneK/.context/main/ai-engineering-protocol.md (cloud) | https://raw.githubusercontent.com/TisoneK/.context/main/ai-engineering-protocol-local.md (local)>
- **Protocol source (blob — for human browsing):** <https://github.com/TisoneK/.context/blob/main/ai-engineering-protocol.md (cloud) | https://github.com/TisoneK/.context/blob/main/ai-engineering-protocol-local.md (local)>
- **Fallback:** if the raw URL 404s, clone `TisoneK/.context` with `--depth 1` and read the file locally — this is the reliable fallback.
- **Since:** YYYY-MM-DD
- **Default role:** <e.g., engineer — unless a session says otherwise; see the protocol package's roles/>
- **Scope:** <e.g., discovery + review + fix all safe issues>
- **Target:** <general sweep | refactor <path> | fix <bug> | feature <description> | review <area> | free text>
- **Focus areas:** <e.g., all — security, performance, UX, architecture, testing, docs>
- **Findings handling:** <e.g., fix safe, flag architectural>
- **Push policy:** <e.g., push to main directly after each commit>
- **Commit style:** <e.g., Conventional Commits with scope; chore(context): for this directory>
- **Commit granularity:** <e.g., one logical change per commit>
- **Deliverable:** <e.g., report in .context/reviews/ + chat summary>
-->

- **Protocol:** ai-engineering-protocol-local.md (local)
- **Protocol source (raw):** https://raw.githubusercontent.com/TisoneK/.context/main/ai-engineering-protocol-local.md
- **Protocol source (blob):** https://github.com/TisoneK/.context/blob/main/ai-engineering-protocol-local.md
- **Fallback:** if the raw URL 404s, clone `TisoneK/.context --depth 1` and read locally
- **Since:** 2026-07-11
- **Default role:** engineer (full-scope) — unless a session hands over a role overlay from the package's `roles/`
- **Scope:** discovery + review + fix all safe issues
- **Target:** general sweep (session default; a chat-message target overrides)
- **Focus areas:** all — security, performance, UX, architecture, testing, docs
- **Findings handling:** fix safe issues; flag architectural changes for approval
- **Push policy:** push to main directly after each commit
- **Commit style:** Conventional Commits with scope; `chore(context):` for this directory
- **Commit granularity:** one logical change per commit
- **Deliverable:** report in `.context/reviews/YYYY-MM-DD-review.md` + chat summary
