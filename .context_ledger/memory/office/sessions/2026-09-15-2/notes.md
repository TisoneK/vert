# Session 2 notes (2026-09-15) — Vercel deploy outage

Ada (S002) · qwen3.8-flash · DESKTOP-3LRR8MD

## Investigation trail (what was tried, in order)

1. **Bisect via GitHub commit statuses** (public REST, no creds):
   `api.github.com/repos/TisoneK/vert/commits/<sha>/status` → last green
   7f44b71 (Aug 17); first red 4c93773 (Sept 2); everything since red,
   including memory-only commits. 42040f7 had NO status (no deploy ran —
   superseded 6 min later by 4c93773).
2. **Local health check of the red tree:** `bun install --frozen-lockfile
   --ignore-scripts` → "no changes" (lock in sync); `bunx next build` +
   `node scripts/standalone-copy.mjs` → exit 0, all routes. Conclusion:
   failure is Vercel-environment-specific.
3. **Ruled out:** sharp 0.35 (linux-x64 binaries exist, engines >=20.9 via
   npm registry API), nanoid/undici override conflicts (grep of bun.lock:
   @vercel/blob wants undici ^6.23.0 ⊂ 6.28.0; postcss wants nanoid
   ^3.3.17 ⊂ 3.3.18), stale-lockfile drift, the standalone-copy script
   itself (it's a direct cp -r equivalent; prod had run cp steps fine).
4. **Dead ends:** no Vercel auth on machine (no ~/.vercel, no VERCEL_TOKEN,
   secrets/ empty); GitHub Actions = billing lock (check-run annotation);
   no Docker, no WSL for a Linux repro; Vercel deploy pages need login.
5. **Break:** owner authorized the Vercel CLI **device flow** —
   `npx -y vercel login tisonkironget@gmail.com` (deprecated email form is
   fine: it prints a `vercel.com/oauth/device?user_code=...` URL the owner
   clicks) → signed in as `tisonek`.
6. **Logs:** `npx -y vercel inspect <deploy-url> --logs`. Failure
   signature: everything green through "Finalizing page optimization" →
   "Running onBuildComplete from Vercel" → `ENOENT
   /vercel/path0/.next/next-server.js.nft.json`. Install log showed
   `+ next@16.3.4` — lock at 7f44b71 had 16.2.9.

## Upstream research

- `api.github.com/search/issues?q=repo:vercel/next.js+next-server.js.nft.json`
  (WebFetch on the GitHub HTML search page TIMED OUT — the REST search API
  is the fast path).
- #96646 (the tracker; closed), #93684 (the regression source: no server
  NFT with adapters), #97287 (fix, canary 2026-08-14), **backport #98167
  merged to next-16-3 2026-09-04**, shipped in **16.3.5 (npm-published
  2026-09-11)**. 16.3.4 (Aug 31) = last broken; matches the failure window
  exactly.
- Why local passes: the skip is gated on adapter presence; local
  `next build` has none, so `.next/next-server.js.nft.json` exists here.
- Known-good workaround for anyone stuck on 16.3.x without the patch:
  drop `output: 'standalone'` (or pin ≤16.2.x).

## Verification chain for the fix

1. `bun add next@16.3.5 --ignore-scripts` (dev server on :3000 holds the
   Prisma engine DLL — plain `bun add` runs postinstall→`prisma generate`
   →EPERM; --ignore-scripts avoids it, client was already generated).
2. `npx -y vercel deploy --yes` → preview ● Ready in 1m, onBuildComplete
   passed in the build logs.
3. Product commit fc10962 pushed to main → production ● Ready (first green
   since Aug 17); live site 200; tag v0.9.2 pushed.

## Durable facts (promoted)

- environments.md: Vercel CLI usable via device flow; inspect --logs; REST
  search over WebFetch.
- backlog: B-2026-09-15-18 lock-drift discipline.
- inefficiencies: Vercel-credential hunt + WebFetch timeout + bun add
  EPERM workaround.
