# Architectural Decisions (append-only, ADR-style)

Decisions already made — future agents respect these rather than
relitigating them. To reverse one, append a new ADR that supersedes it.

<!-- TEMPLATE — copy below the last entry:
---
## ADR-N: <short title> (YYYY-MM-DD)
- **Status:** accepted | superseded by ADR-M
- **Context:** <what forced the decision>
- **Decision:** <what was decided>
- **Consequences:** <trade-offs accepted; what future agents must respect>
-->

---
## ADR-1: Internal-only behavior changes skip the public CHANGELOG + version bump (2026-07-11)
- **Status:** accepted
- **Context:** The 400-vs-500 malformed-body fix (commit b21a094) changed
  behavior, which normally triggers a CHANGELOG entry + version bump per the
  protocol's quality gates. But `CHANGELOG.md` is rendered on a public,
  unauthenticated `/changelog` page and is explicitly user-facing only
  (grandmother test; no API/route/technical detail). The fix is invisible to
  normal users — it only affects malformed API requests.
- **Decision:** Behavior changes that are not observable by a normal user go
  in `docs/DEVLOG.md` (technical log) only — not the public CHANGELOG — and do
  not, on their own, force a version bump. They ride along with the next
  user-facing release.
- **Consequences:** Future agents: the repo's public-changelog rule outranks
  the protocol's generic "behavior changed → changelog" gate. Judge by user
  visibility. Always still write the DEVLOG entry.
