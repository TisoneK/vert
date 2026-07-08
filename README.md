# Vert

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![License](https://img.shields.io/github/license/TisoneK/vert)](LICENSE)
[![Dependencies](https://img.shields.io/badge/dependencies-up--to--date-brightgreen)](#)

## Table of Contents

- [Overview](#overview)
- [Quickstart](#quickstart)
- [Installation](#installation)
- [Environment](#environment)
- [Scripts](#scripts)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Prisma / Database](#prisma--database)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [Security](#security)
- [Changelog](#changelog)

## Overview

`Vert` is a portrait-first video platform built with Next.js 16 (App Router),
React 19, TypeScript, Prisma + PostgreSQL, Vercel Blob for media storage,
NextAuth for authentication, and Tailwind CSS v4 — see
[ARCHITECTURE.md](./ARCHITECTURE.md) for the full design rationale.

## Quickstart

```bash
bun install
bun run db:generate    # generate Prisma client
bun run db:push        # create PostgreSQL DB + apply schema
bun prisma/seed.ts     # (optional) load demo data
bun run dev            # http://localhost:3000
```

Demo logins after seeding:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@vert.com` | `admin123` |
| Member | `user1@vert.com` … `user5@vert.com` | `password123` |

## Installation

1. Clone the repository
2. Install dependencies: `bun install` (Node 20+ also works with `npm install`)
3. Create a `.env.local` from the variables listed under [Environment](#environment)
4. Run `bun run db:generate` and `bun run db:push` to set up the database

## Environment

Required environment variables (set in `.env.local`, never committed — see [`.env.example`](./.env.example) for a full template):

- `DATABASE_URL` — PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/vert`). Serverless pool params (`connection_limit=1&pool_timeout=10`) are appended automatically by `src/lib/db.ts`.
- `NEXTAUTH_SECRET` — random secret for JWT signing (generate with `openssl rand -hex 32`)
- `NEXTAUTH_URL` — app URL (e.g. `http://localhost:3000` for dev)

Optional:

- `VERT_BLOB_READ_WRITE_TOKEN` or `BLOB_READ_WRITE_TOKEN` — Vercel Blob token for video/image uploads (required for upload functionality; the latter is auto-set when a Blob store is connected via the Vercel dashboard)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials (optional; credentials provider works without them)
- `SEED_KEY` — secret key for protected internal endpoints (seed, cleanup-demo)

## Scripts

- `bun run dev` — runs Next.js in development on port 3000
- `bun run build` — builds the app for production (standalone output)
- `bun run start` — starts the production server
- `bun run lint` — runs ESLint
- Prisma helpers: `db:push`, `db:generate`, `db:migrate`, `db:reset`

## Development

- Run `bun run dev` and open `http://localhost:3000`
- Frontend files live under `src/components/vert/`
- API routes are in `src/app/api/v1/` (REST) and `src/app/api/auth/` (NextAuth)
- Do not edit `src/components/ui/` directly — those are shadcn/ui primitives

## Testing

No test runner is configured yet. When adding tests, the recommended stack is:
- **Vitest** for unit tests
- **Playwright** for end-to-end tests
- Run via `bun run test` (script to be added)

## Deployment

- The project builds into a standalone Next.js server (`.next/standalone/`).
- Recommended deployment target: **Vercel** (auto-redeploy on push to `main`).
- Environment variables must be set in the Vercel dashboard — code-only pushes do not propagate env changes.

## Prisma / Database

Prisma helper scripts included in `package.json`:

- `bun run db:push` — push Prisma schema to the database (dev workflow)
- `bun run db:generate` — generate Prisma client (run after schema changes)
- `bun run db:migrate` — create + apply a migration (production workflow)
- `bun run db:reset` — reset the database and re-apply migrations

Edit `prisma/schema.prisma` and set `DATABASE_URL` before running migrations.

Note: `src/lib/db.ts` uses a lazy-initialized Prisma client (Proxy pattern) so
that a missing `prisma generate` no longer crashes the entire app at import
time. See the file header for details.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for:
- The architectural choices (PostgreSQL, Vercel Blob, NextAuth, SPA-on-Next.js shell) and why they were chosen
- A file map for new contributors

## Contributing

- Fork the repo, create a feature branch, open a pull request.
- Follow the existing code style and run `bun run lint` before submitting.
- For changes that affect data shape or API contracts, update `CHANGELOG.md`.

## Security

- Report security issues to the maintainers privately.
- Do not commit secrets; use env vars or secret stores.
- All API routes are auth-checked via `getCurrentUser` / `requireAdmin` from `src/lib/auth-helpers.ts`.
- Passwords are hashed with bcryptjs (cost factor 12); `passwordHash` is never serialized in API responses.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## Acknowledgements

- Built with Next.js, Tailwind CSS, Prisma, shadcn/ui, and hls.js.

