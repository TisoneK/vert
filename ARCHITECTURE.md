# Vert — Architecture Decision Record

_Last updated: 2026-06-21_

This document captures the **intentional** architectural choices in the current
codebase, where they diverge from the originally-spec'd design, and what would
need to change to migrate. It is intended as a reference for new contributors
and stakeholders reviewing the project.

---

## 1. v1 architecture (current)

| Layer | Choice | Why this was chosen for v1 |
|---|---|---|
| Database | **SQLite** (via Prisma) | Zero-infra; lets the app boot in any environment without provisioning a database server. Sufficient for a single-instance demo and small-scale testing. |
| Auth | **NextAuth v4** (Credentials provider, bcrypt + JWT, 30-day sessions) | Self-contained — no third-party identity service dependency. Works offline. Easier to reason about than Clerk for a small team. |
| Video storage | **Local filesystem** under `public/uploads/{yyyy-mm}/` | Same reasoning as SQLite: zero infra. Files served directly by Next.js static handler. Explicitly flagged as a dev fallback in the upload route. |
| Cache / queue | **None** | Not needed at current scale. Adding Redis now would be premature infrastructure. |
| Routing | **Single-route SPA** at `/` driven by a Zustand `currentView` store in `VertApp.tsx` | Lets the team iterate on UX without fighting the Next.js App Router for every state change. **Trade-off:** no deep-linkable URLs for videos/channels (being addressed — see §3). |
| Deployment | **Vercel** (auto-redeploy on push to `main`) | Zero-config CI/CD; matches the Next.js happy path. |

---

## 2. Originally-spec'd design (deferred)

The original product spec called for:

| Layer | Spec'd choice | Why deferred |
|---|---|---|
| Database | PostgreSQL | SQLite handles our read-heavy workload fine at current volume; Postgres is a migration we'll do when write contention or multi-instance deploys force it. |
| Auth | Clerk | Adds a third-party dependency and per-seat cost; NextAuth is doing the job. |
| Video storage | Cloudflare Stream | Stream handles transcoding, HLS generation, and CDN — all of which we'd otherwise build ourselves. Migration is planned once we have real video volume and a budget. |
| Cache / queue | Redis | No features currently need it. Will revisit when we add: email sending, background transcoding, real-time notifications. |

These are **deferred, not cancelled**. Each one is a known migration path
documented in `CHANGELOG.md` or in code comments where the v1 fallback lives.

---

## 3. Migration triggers

We will revisit each deferral when one of these triggers fires:

| Trigger | Migrations it forces |
|---|---|
| > 1 concurrent writer hitting SQLite's write lock with measurable latency | SQLite → Postgres |
| Multi-instance deploy (≥ 2 web servers) | SQLite → Postgres + uploads → S3/R2 (local FS doesn't survive server replacement) |
| Real user-uploaded video volume > a few GB total | Uploads → S3/R2 + add transcoding pipeline |
| Need for real-time notifications, background jobs, or email sending | Add Redis (queues) + worker process |
| SOC 2 / SSO / enterprise auth requirements | NextAuth → Clerk (or Auth.js v5 with an OIDC provider) |

Until then, the v1 architecture is a deliberate trade-off: **speed of iteration
over scalability**. This is the right call while product-market fit is still
being validated.

---

## 4. Known v1 limitations (acceptable for now)

- **No deep-linkable URLs.** Sharing `https://vert.app/watch/<id>` doesn't work; the URL is always `https://vert.app/`. Being fixed in this release — see the new `/watch/[id]` and `/channel/[id]` routes.
- **No horizontal scaling.** Local-FS uploads and SQLite both pin us to one instance. Fine for Vercel's free tier; not fine for production scale.
- **No background transcoding.** Uploaded videos are served as-is. The `hls.js` player works but has no renditions to switch between unless the source is already HLS.
- **No CI pipeline.** Lint + build only run locally. A GitHub Actions workflow is being added in this release.

---

## 5. File map

For new contributors orienting themselves:

```
prisma/schema.prisma        # SQLite schema + all models
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
