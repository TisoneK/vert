# Release Review — Production Changelog Alignment — 2026-08-04 (Session 13)

- **Agent:** Buffy | **Model:** openai/gpt-5.6-luna | **Platform:** Baos-Mac-mini (macOS 15.7.7, Darwin 24.6.0) | **Role:** engineer | **Core:** 0.5.0
- **Target:** Align public release notes with the repository's automatic deploy-on-push workflow.

## Finding

Vert's README and CI documentation state that pushes to `main` automatically
redeploy to Vercel. User-visible features from Sessions 8–12 had nevertheless
remained under `[Unreleased]` in both `CHANGELOG.md` and `docs/DEVLOG.md`, making
production functionality appear pre-released on the public changelog page.

## Correction

- Moved the deployed Sessions 8–12 entries into `## [0.6.11] — 2026-08-04`.
- Added a fresh empty `[Unreleased]` section for future, not-yet-deployed work.
- Bumped `package.json` from `0.6.10` to `0.6.11`.
- Updated comparison references in both changelog files.
- Created and pushed annotated tag `v0.6.11` so release links resolve.

## Validation

- Changelog parser smoke test recognized `Unreleased`, `0.6.11`, and `0.6.10`.
- `npx tsc --noEmit` — exit 0.
- `npx eslint .` — exit 0; 0 errors and 19 existing warnings.
- `npx next build` — exit 0.
- `main` and `origin/main` are synchronized; remote `v0.6.11` points at the
  release commit `49b015a`.

## Decision

ADR-7 establishes that a successful push to `main` is a production release for
changelog purposes. Future sessions must publish deployed user-facing work under
a numbered version and leave `[Unreleased]` only for work not yet on production.
