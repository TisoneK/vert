# Vert — Architecture Decision Record

_Last updated: 2026-07-07_

This document captures the **intentional** architectural choices in the current
codebase, where they diverge from the originally-spec'd design, and what would
need to change to migrate. It is intended as a reference for new contributors
and stakeholders reviewing the project.

---

## 1. v1 architecture (current)

| Layer | Choice | Why this was chosen for v1 |
|---|---|---|
| Database | **PostgreSQL** (via Prisma) | Production-grade relational store, hosted on Neon (Vercel Postgres). The original SQLite prototype was migrated to Postgres in v0.3.0 — see §2. |
| Auth | **NextAuth v4** (Credentials provider, bcrypt + JWT, 30-day sessions) | Self-contained — no third-party identity service dependency. Works offline. Easier to reason about than Clerk for a small team. |
| Video storage | **Vercel Blob** (S3-compatible) | Direct-to-Blob client uploads bypass serverless 4.5 MB body limit. Was local-filesystem in the prototype; migrated to Blob in v0.3.0. See upload route for dev fallback. |
| Cache / queue | **None** | Not needed at current scale. Adding Redis now would be premature infrastructure. |
| Routing | **SPA shell** on Next.js App Router — `VertApp.tsx` owns navigation in Zustand, URL synced via `pathToView`/`viewToPath` | Best of both worlds: smooth in-app navigation (no full reloads) + deep-linkable URLs for every page (see v0.4.0). All routes have real Next.js route files. |
| Deployment | **Vercel** (auto-redeploy on push to `main`) | Zero-config CI/CD; matches the Next.js happy path. |

---

## 2. Originally-spec'd design (deferred)

The original product spec called for:

| Layer | Spec'd choice | Why deferred |
|---|---|---|
| Database | PostgreSQL (Neon) | ✅ **Completed** — migrated from SQLite in v0.3.0. The schema now uses `provider = "postgresql"`. Neon's serverless Postgres handles connection pooling and scales to zero. |
| Auth | Clerk | Adds a third-party dependency and per-seat cost; NextAuth is doing the job. |
| Video storage | Cloudflare Stream | Stream handles transcoding, HLS generation, and CDN — all of which we'd otherwise build ourselves. Local FS was replaced with Vercel Blob in v0.3.0; Stream is the next step once we have real video volume and a budget. |
| Cache / queue | Redis | No features currently need it. Will revisit when we add: email sending, background transcoding, real-time notifications. |

These are **deferred, not cancelled**. Each one is a known migration path
documented in `CHANGELOG.md` or in code comments where the v1 fallback lives.

---

## 3. Migration triggers

We will revisit each deferral when one of these triggers fires:

| Trigger | Migrations it forces |
|---|---|
| > 1 concurrent writer hitting Postgres write contention | Add PgBouncer connection pooling or move to Neon's pooled mode |
| Multi-instance deploy (≥ 2 web servers) | Uploads → S3/R2 (Blob already works cross-instance; local-filesystem fallback removed in v0.3.0) |
| Real user-uploaded video volume > a few GB total | Uploads → S3/R2 + add transcoding pipeline |
| Need for real-time notifications, background jobs, or email sending | Add Redis (queues) + worker process |
| SOC 2 / SSO / enterprise auth requirements | NextAuth → Clerk (or Auth.js v5 with an OIDC provider) |

Until then, the v1 architecture is a deliberate trade-off: **speed of iteration
over scalability**. This is the right call while product-market fit is still
being validated.

---

## 4. Known v1 limitations (acceptable for now)

- **No background transcoding.** Uploaded videos are served as-is. The `hls.js` player works but has no renditions to switch between unless the source is already HLS.
- **No CI pipeline.** Lint + build only run locally. A GitHub Actions workflow would automate testing on PRs.
- **No test suite.** No test runner is configured yet. Recommended: Vitest for unit tests, Playwright for E2E.

---

## 5. File map

For new contributors orienting themselves:

```
prisma/schema.prisma        # PostgreSQL schema + all models
prisma/seed.ts              # Demo data (admin + 5 users + 21 videos + notifications)
src/app/api/v1/             # REST API (36 route handlers, all auth-checked)
src/app/api/auth/           # NextAuth route + register + session-info
src/components/vert/        # All application components (do not edit ui/ directly)
src/components/ui/          # shadcn/ui primitives
src/lib/db.ts               # Prisma client (lazy-initialized)
src/lib/auth.ts             # NextAuth config (Credentials + JWT)
src/lib/auth-helpers.ts     # getCurrentUser / requireAuth / requireAdmin
src/lib/store.ts            # Zustand stores (navigation + auth)
```

---

## 6. Where decisions live

- **`VERT-RULES.md`** — project-wide working preferences and rules (not committed to this repo; tracked separately by the team).
- **`CHANGELOG.md`** — what changed in each release, in plain English.
- **`ARCHITECTURE.md`** (this file) — why the architecture is the way it is, and when it will change.
- **Code comments** — local rationale for non-obvious decisions (e.g. `src/lib/db.ts` explains the lazy-proxy pattern; `src/app/api/v1/upload/route.ts` flags the dev-only storage backend).
