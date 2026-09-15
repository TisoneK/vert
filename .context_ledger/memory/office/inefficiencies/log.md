# Inefficiency Log (append-only — real friction only)

Append a block **only when something actually slowed you down** — a clean
session appends nothing (its `agents/sessions.md` entry is the record;
"none this session" blocks are noise, not history). But when something
bit you, the block is mandatory and honest: friction you absorb silently
is friction the next agent hits blind.

Most inefficiencies are project-local (an environment quirk, a one-off
cost) and stay here. When one is actually **protocol-level** — the core
workflow itself made you slower and every project would hit it — mark it
`Upstream: candidate`. `ledger-sync harvest` collects those (and open
`flaws/`) into the package for an upstream fix. Unmarked entries are
never harvested.

Append-only, but compactable — the log never grows without bound:

- **Resolved entries move verbatim** to cold storage: once an entry is
  explicitly marked `RESOLVED` / `superseded` / fixed, cut it unchanged
  into `archive.md` in this directory so startup reads only the live
  entries. Age alone never makes an entry eligible.
- **Repeats roll up:** when 3+ entries describe the same recurring thing
  (same failing tool, same root cause), append ONE consolidated
  `Recurring` entry — the pattern, how many times, the current
  workaround — and move the individual entries verbatim into
  `archive.md`. The live log keeps the pattern, not the repeats.

`ledger-mem prune` reports log sizes, archive-eligible entries (`--list`
names them), and roll-up candidates.

<!-- TEMPLATE — copy below the last entry:
---
## YYYY-MM-DD — <agent> / <model>
- **Problem:** <what went wrong or was slower than it should be>
- **Cost:** <rough time/effort wasted>
- **Cause:** <root cause if known>
- **Workaround / fix:** <what worked, or "unresolved">
- **Prevent next time:** <protocol/context change that would have avoided it>
- **Upstream:** candidate  ← add this line ONLY for protocol-level friction
  worth a core fix; omit entirely for project-local friction.
-->
---
## 2026-09-15 — Ada / qwen3.8-flash
- **Problem:** ~40 min spent ruling out plausible build-break causes (sharp 0.35 platform binaries, nanoid/undici override conflicts, lockfile drift) by reasoning + registry/lockfile greps — because the failing Vercel build logs were unreadable: no Vercel CLI on the machine, no `VERCEL_TOKEN`, no `~/.vercel` creds.
- **Cost:** one dead-end hypothesis chain + one owner round-trip (forwarding the failure emails) before logs were reachable.
- **Cause:** the deploy platform's failure state lives only in its logs; the repo's memory recorded the Vercel auto-deploy fact but never how to read those logs from this machine.
- **Workaround / fix:** `npx -y vercel login <owner-email>` (device flow — owner clicks the printed URL), then `npx -y vercel inspect <deploy-url> --logs` gives the full build log. The failed deployment id also appears in each commit's GitHub `Vercel` status description (`npx vercel inspect dpl_... --logs`).
- **Prevent next time:** environments.md (DESKTOP-3LRR8MD block) now records the device-flow + inspect --logs commands and the CLI-persistence quirk, so the next agent reads logs first instead of bisecting hypotheses.
