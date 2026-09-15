# Vercel deploy outage — diagnosis and repair (2026-09-15)

Ada (S002) · qwen3.8-flash · DESKTOP-3LRR8MD · product fix `fc10962` (v0.9.2)

## What happened

Every production deployment on Vercel had been failing silently since
September 2 — you learned about it only from the failure emails, the last
good build was August 17's v0.9.0, and the September 2 security fixes were
stuck undeployed for 13 days. The email you forwarded about commit b7f8cc7
was just the newest instance, not a special commit.

## Root cause

The September 2 dependency security sweep regenerated `bun.lock`, and the
`^16.2.11` range on Next.js let the lock quietly move to **16.3.4**. Next
16.3.0–16.3.4 has an upstream regression: when a build runs with an adapter
(Vercel's builder attaches one) and the config keeps `output: 'standalone'`
(needed for the self-hosted/Caddy deployment), Next stops emitting
`.next/next-server.js.nft.json` — the file Vercel's own build-completion
hook reads. So every Vercel build compiled, type-checked, generated all 52
static pages, and then died on the last step with `ENOENT`. Locally it
never reproduced because a plain local `next build` has no adapter and does
emit the file — which is why the codebase looked perfectly healthy from
this machine.

Tracked upstream as vercel/next.js#96646 (regression introduced by
#93684). The fix shipped on the 16.3 release line on September 11 in
**16.3.5** — the lock had drifted 16.3.4, one patch before the fix.

## The fix

One commit (`fc10962`): `next` bumped to **16.3.5**, released as **v0.9.2**
(tag pushed). Verified before merging with a Vercel *preview* deploy (same
builder that kept failing — passed in ~1m), then the push to `main`
produced the first green production deploy in 13 days; the live site now
serves 0.9.2 and the September 2 security updates landed with it.

## Why the emails landed the way they did

- GitHub Actions could not act as an early-warning system: the CI account
  is billing-locked, so the workflow "fails in 2 seconds" without ever
  running (pre-existing, in the backlog).
- The failing commits were mostly memory-file commits — nothing in their
  diffs could break a build. The poison was the lockfile from Sept 2 that
  every subsequent build inherited.

## Follow-up left open

Backlog row B-2026-09-15-18: when a sweep regenerates the lock, keep
within the current minor range (the drift 16.2→16.3 crossed a regression
boundary and nobody noticed for two weeks).
