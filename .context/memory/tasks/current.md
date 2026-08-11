# Current Task (overwrite each session)

- **Status:** in-progress
- **Session:** 36 (2026-08-11)
- **Agent:** Claude Code / claude-opus-4-8 (local, Baos-Mac-mini)
- **Role:** feature-engineer — implementing ADR-27 (owner approved this turn)
- **Task:** Contact-form integrity — the form must not fake a delivered success. No email
  infra and DB schema changes need approval, so implement the honest-copy path: replace the
  simulated `setTimeout` "Message sent" with a real contact channel (mailto/visible address)
  and remove the false confirmation. Implements review 2026-08-11 [H2], ADR-27.
- **Part of:** autonomous grouped implementation of the 2026-08-11 review (S34…S39).
