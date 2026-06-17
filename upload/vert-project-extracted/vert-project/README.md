# Vert — Project Folder
*Last updated: 6 June 2026*

---

## Documents

| File | Purpose | Audience |
|---|---|---|
| `vert-platform-spec.md` | Product, market, features, business model, permissions | Product / business / stakeholders |
| `vert-technical-spec.md` | Architecture, stack, data models, API reference, build phases | Engineering / AI builder / developers |

---

## Key Decisions (Summary)

| Area | Decision |
|---|---|
| Architecture | Modular monolith (not microservices) |
| Backend | Node.js v22 + Express + TypeScript |
| Database | PostgreSQL + Drizzle ORM + Redis |
| Frontend | React 19 + Tailwind CSS v4 + Vite |
| Mobile | React Native + Expo |
| Video hosting (MVP) | Cloudflare Stream |
| Auth | Clerk |
| Email | Resend |
| Search (MVP) | PostgreSQL full-text search |

---

## Open Decisions

| # | Decision | Status |
|---|---|---|
| 1 | AI build platform (Eric's tool vs. GLM 5.1) | Pending — run test |
| 2 | Video hosting confirmation (Cloudflare Stream) | Pending |
| 3 | Ad network for launch (AdPlayer.Pro + direct deals) | Pending outreach |
| 4 | Creator payout provider (Stripe Connect) | Pending |
| 5 | Full content guidelines document | Not started |
| 6 | DMCA / legal compliance review | Not started |

---

## What's Fixed vs. Original Specs

**Platform spec:**
- Added full permissions matrix (roles × features)
- Defined feed/discovery logic (chronological MVP; no algorithm at launch)
- Replaced flat rev share with milestone-based creator tier model
- Added creator eligibility criteria (subscribers, views, standing)
- Added ad network strategy with clear MVP vs. growth vs. scale path
- Added indicative revenue scenarios
- Added explicit MVP scope boundary (what's in vs. out)
- Added regulatory risks (DMCA, COPPA, GDPR)
- Replaced open items list with structured decisions table

**Technical spec:**
- Fixed `Channel (extends User)` model — channel is now a separate table linked by FK, not a subtype
- Added full SQL DDL for all data models with types, constraints, and indexes
- Fixed upload flow diagram to include aspect ratio validation failure path
- Added full API request/response shapes and standard error format
- Added API versioning (`/api/v1/`)
- Added Architecture Decision Record (ADR) table
- Added Phase 1 prerequisite gate before Phase 2 starts
- Added webhook security note (signature validation)
