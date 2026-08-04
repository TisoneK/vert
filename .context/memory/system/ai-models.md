# Agent + Model Registry (update in place)

Which agents and models have worked on this repo — and what they've
shown they can and can't do here. Update your row each session (last
seen + session count); add a row if you're new. The Observations
section is how the user learns which agent to hand which task, and how
agents learn a predecessor's blind spots (and verify its work
accordingly).

<!-- TEMPLATE — one row per agent+model pair:
| <agent name> | <model id> | YYYY-MM-DD | YYYY-MM-DD | <count> |
-->

| Agent | Model | First seen | Last seen | Sessions |
|---|---|---|---|---|
| Claude Code | claude-opus-4-8 | 2026-07-11 | 2026-08-04 | 4 |
| Claude Code | claude-fable-5 | 2026-07-14 | 2026-07-14 | 2 |
| Buffy | deepseek-v4-flash | 2026-08-01 | 2026-08-01 | 1 |

## Observations

- **Claude Code / claude-opus-4-8:** Model id is stated explicitly in this agent's system prompt, so it is recorded verbatim (not guessed). (2026-07-11)
- **Claude Code / claude-fable-5:** Model id stated in system prompt, recorded verbatim. Ran the full local-edition protocol end-to-end (Sessions 2–3); verified an API fix live against `next dev` via curl, including a NextAuth credentials login attempt. (2026-07-14)
- **Claude Code / claude-opus-4-8:** Session 5 (core 0.3.0 update + CI deploy gate) and Session 6 (react-query migration, eslint 35→0) both ran on 2026-07-21/22 — row's last-seen/session-count updated accordingly. (2026-08-01)
- **Buffy / deepseek-v4-flash:** Model id stated in system prompt, recorded verbatim. First session = context sync (core 0.3.0→0.5.0, sessions module adoption). Completed a full local-edition session start-to-finish with no friction. (2026-08-01)
- **Claude Code / claude-opus-4-8:** Session 8 (feature-engineer role) — shipped the hover/touch pre-fetch feature and verified it live via the browser pane (server request-log evidence, DOM inspection). Confirmed the Session-6 finding that browser-pane coordinate/ref clicks are unreliable here (used programmatic `element.click()`), and additionally that real CDP `hover` DOES fire React `onMouseEnter` while dispatched synthetic `mouseover` events do not. (2026-08-04)

Concrete, evidence-based capabilities and limits — things demonstrated
in this repo's sessions, not marketing claims or self-assessment.
Update in place when a newer session contradicts an old observation.

<!-- TEMPLATE — one bullet per observation:
- **<agent> / <model>:** <what was observed — concrete and checkable, e.g. "Read tool truncates files >500 lines; needs offset/limit", "SSRF fix shipped with regression test, verified green"> (YYYY-MM-DD)
-->
