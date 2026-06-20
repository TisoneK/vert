# Vert
## Badges

- [![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
- [![Release](https://img.shields.io/github/v/bao/vert?color=blue)](https://github.com/bao/vert/releases)
- [![License](https://img.shields.io/github/license/bao/vert)](LICENSE)
- [![npm version](https://img.shields.io/npm/v/nextjs_tailwind_shadcn_ts)](https://www.npmjs.com/package/nextjs_tailwind_shadcn_ts)
- [![Dependencies](https://img.shields.io/badge/dependencies-up--to--date-brightgreen)](#)

## Table of Contents

- Overview
- Quickstart
- Installation
- Environment
- Scripts
- Development
- Testing
- Deployment
- Prisma / Database
- Contributing
- Code of Conduct
- Security
- Authors
- License
- Changelog

## Overview

`Vert` is a full-stack Next.js application scaffolded for fast development and production deployments. It includes common features such as auth, API routes, Prisma ORM, and a component library.
## Overview

`Vert` is a full-stack Next.js application scaffolded for fast development and production deployments. It includes common features such as auth, API routes, Prisma ORM, and a component library.

## Quickstart

```bash
npm install
npm run dev
```

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` from `.env.example` and set required env vars

## Environment

Required environment variables (example names):

- `DATABASE_URL` — Prisma database connection string
- `NEXTAUTH_SECRET` — NextAuth secret
- `NODE_ENV` — `development` | `production`

Store secrets securely (CI secrets, cloud environment variables, or Vault).

## Scripts

- `npm run dev` — runs Next.js in development on port 3000
- `npm run build` — builds the app for production
- `npm run start` — starts the production server
- `npm run lint` — runs ESLint
- Prisma helpers: `db:push`, `db:generate`, `db:migrate`, `db:reset` (see below)

## Development

- Run `npm run dev` and open `http://localhost:3000`
- Frontend files live under `src/components` and `src/app`
- API routes are in `src/app/api`

## Testing

Add your test runner and scripts. Example with Jest/Playwright would go here.

## Deployment

- This project builds into a standalone Next server. The `build` script prepares `.next/standalone` for production.
- Recommended deployment targets: Vercel (serverless), Bun on Docker, or a Node-compatible host.

## Prisma / Database

Prisma helper scripts included in `package.json`:

- `npm run db:push` — push Prisma schema to the database
- `npm run db:generate` — generate Prisma client
- `npm run db:migrate` — run migrations (development)
- `npm run db:reset` — reset the database and apply migrations

Edit `prisma/schema.prisma` and set `DATABASE_URL` before running migrations.

## Contributing

- Fork the repo, create a feature branch, open a pull request.
- Follow the existing code style and run `npm run lint`.

## Code of Conduct

Please follow a professional and respectful code of conduct in issues and PRs.

## Security

- Report security issues to the maintainers privately.
- Do not commit secrets; use env vars or secret stores.

## Authors

- Project: Vert maintainers

## License

Add a `LICENSE` file to indicate project licensing. This repository currently has no license.

## Changelog

See [Changelog](CHANGELOG.md).

## Acknowledgements

- Built with Next.js, Tailwind CSS, Prisma, and shadcn-style components.

