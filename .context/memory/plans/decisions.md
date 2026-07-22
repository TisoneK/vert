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

---
## ADR-2: The ESLint React-Compiler "burndown" is a react-query migration, deferred (2026-07-21)
- **Status:** accepted
- **Context:** The 35 pre-existing eslint errors are React-Compiler rules:
  22 `react-hooks/immutability` ("fetch fn accessed before declared"), 12
  `react-hooks/set-state-in-effect`, 1 `react-hooks/purity`. They looked like
  a mechanical lint cleanup. Empirically they are not: memoizing an
  effect-called fetch fn with `useCallback` (the fix for the immutability
  error) makes the fn analyzable, which then trips `set-state-in-effect` —
  and that rule fires for ANY effect that transitively calls setState, sync
  OR async (verified on both HomeFeed's `setLoading(true)` and UploadPage's
  await-then-`setCategories`). So the two rule classes are fully coupled:
  there is no immutability-only file that can be cleaned without surfacing a
  set-state error. The whole class is the fetch-in-`useEffect`+`setState`
  pattern across ~20 components.
- **Decision:** The correct fix is migrating those components to
  `@tanstack/react-query` (already a dependency) — an architectural change,
  flagged for approval per the standing workflow. On 2026-07-21 the owner
  chose "safe subset now, defer migration." Safe subset shipped (commit
  `67f1009`): `use-mobile.ts` → `useSyncExternalStore` and `sidebar.tsx`
  skeleton width → hashed `useId()`. Both are genuinely standalone (not
  fetch-in-effect). Baseline 35 → 33.
- **Consequences:** Do NOT attempt to "burn down" the remaining 33 with
  `useCallback`/reordering/eslint-disable — it just trades immutability for
  set-state and churns 20 files for no net gain. The CI lint step stays
  advisory (`continue-on-error`) until the react-query migration lands, at
  which point flip it to blocking. Treat the migration as its own scoped,
  approved effort with per-component verification (behavior + caching).
