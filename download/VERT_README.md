# Vert — Portrait Video Platform
**Codebase Package** · Generated 6 June 2026

---

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Set up environment variables (.env already included)
# DATABASE_URL=file:./db/custom.db
# NEXTAUTH_SECRET=vert-secret-key-change-in-production
# NEXTAUTH_URL=http://localhost:3000

# 3. Push database schema & seed demo data
bun run db:push
bun run db:generate
npx prisma db seed

# 4. Run the dev server
bun run dev
```

---

## Project Structure

```
vert-platform/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Main SPA entry point
│   │   ├── layout.tsx                  # Root layout with dark theme
│   │   ├── globals.css                 # Global styles & CSS variables
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts  # NextAuth handler
│   │       │   ├── register/route.ts       # User registration
│   │       │   └── session-info/route.ts   # Session info endpoint
│   │       └── v1/
│   │           ├── videos/
│   │           │   ├── route.ts             # GET (feed), POST (create)
│   │           │   └── [id]/
│   │           │       ├── route.ts         # GET, PATCH, DELETE video
│   │           │       ├── vote/route.ts    # POST, DELETE vote
│   │           │       ├── flag/route.ts    # POST flag
│   │           │       └── comments/route.ts # GET, POST comments
│   │           ├── channels/
│   │           │   └── [id]/
│   │           │       ├── route.ts         # GET, PATCH channel
│   │           │       └── subscribe/route.ts # POST, DELETE subscription
│   │           ├── comments/[id]/route.ts  # DELETE comment
│   │           ├── upload/route.ts          # POST file upload
│   │           └── admin/
│   │               ├── flags/route.ts       # GET flags
│   │               ├── flags/[id]/route.ts  # PATCH flag status
│   │               ├── channels/[id]/route.ts # PATCH suspend, DELETE
│   │               └── videos/[id]/route.ts   # DELETE video
│   ├── components/
│   │   ├── vert/                        # Vert-specific components
│   │   │   ├── VertApp.tsx              # Main app shell with view routing
│   │   │   ├── Header.tsx              # Top nav bar with search & auth
│   │   │   ├── Sidebar.tsx             # Desktop sidebar navigation
│   │   │   ├── MobileNav.tsx           # Mobile bottom navigation
│   │   │   ├── HomeFeed.tsx            # Video feed grid
│   │   │   ├── VideoCard.tsx           # 9:16 portrait video card
│   │   │   ├── VideoPlayer.tsx         # Portrait video player
│   │   │   ├── VideoDetail.tsx         # Video page with player + info
│   │   │   ├── ChannelPage.tsx         # Channel profile + videos
│   │   │   ├── ProfilePage.tsx         # Own channel with edit
│   │   │   ├── UploadPage.tsx          # Video upload form
│   │   │   ├── SearchResults.tsx       # Search results view
│   │   │   ├── VoteButtons.tsx         # Like/dislike buttons
│   │   │   ├── CommentSection.tsx      # Comments list + add
│   │   │   ├── SubscribeButton.tsx     # Subscribe/unsubscribe
│   │   │   ├── FlagDialog.tsx          # Flag video dialog
│   │   │   ├── AdminDashboard.tsx      # Flag review + moderation
│   │   │   ├── LoginForm.tsx           # Login form
│   │   │   └── SignupForm.tsx          # Registration form
│   │   └── ui/                         # shadcn/ui components (40+)
│   ├── lib/
│   │   ├── auth.ts                     # NextAuth configuration
│   │   ├── auth-helpers.ts             # getCurrentUser, requireAuth, requireAdmin
│   │   ├── db.ts                       # Prisma client instance
│   │   ├── store.ts                    # Zustand stores (navigation + auth)
│   │   ├── utils-vert.ts              # Vert-specific formatters
│   │   └── utils.ts                    # General utility functions
│   └── hooks/
│       ├── use-toast.ts                # Toast notifications hook
│       └── use-mobile.ts              # Mobile detection hook
├── prisma/
│   ├── schema.prisma                   # Database schema (8 models)
│   └── seed.ts                         # Demo data seed script
├── db/
│   └── custom.db                       # SQLite database with demo data
├── public/
│   ├── logo.svg                        # Vert logo
│   ├── robots.txt                      # Robots config
│   └── uploads/                        # Uploaded video files
├── .env                                # Environment variables
├── package.json                        # Dependencies & scripts
├── bun.lock                            # Bun lockfile
├── tsconfig.json                       # TypeScript config
├── tailwind.config.ts                  # Tailwind CSS config
├── next.config.ts                      # Next.js config
├── postcss.config.mjs                  # PostCSS config
├── eslint.config.mjs                   # ESLint config
├── components.json                     # shadcn/ui config
└── Caddyfile                           # Caddy reverse proxy config
```

---

## Database Models

| Model | Description |
|-------|-------------|
| **User** | Accounts with role (member/admin), OAuth support |
| **Channel** | One per user (created on first upload), with subscriber count |
| **Video** | 9:16 portrait videos with status (processing/ready/error/removed) |
| **Comment** | Text comments on videos (soft-delete) |
| **Vote** | Like/dislike (one per user per video) |
| **Subscription** | Channel subscriptions with email notification opt-in |
| **Flag** | Content flags with reason and review status |
| **AdminAction** | Audit log of all admin moderation actions |

---

## Demo Accounts

| Role | Email | Password | Channel |
|------|-------|----------|---------|
| Admin | admin@vert.com | admin123 | (no channel) |
| Member | user1@vert.com | password123 | Creative Queen |
| Member | user2@vert.com | password123 | Tech Craft |
| Member | user3@vert.com | password123 | Travel Vert |
| Member | user4@vert.com | password123 | Foodie Shots |
| Member | user5@vert.com | password123 | Fit Flow |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | SQLite via Prisma ORM |
| Auth | NextAuth.js v4 (credentials provider) |
| State | Zustand (nav) + React Query (server) |
| Icons | Lucide React |

---

## API Endpoints (v1)

All endpoints prefixed `/api/v1/`. Auth via `Authorization: Bearer <JWT>`.

### Videos
- `GET /videos` — Paginated feed (?page, limit, channel_id, search)
- `GET /videos/:id` — Single video with channel
- `POST /videos` — Create video (auth)
- `PATCH /videos/:id` — Update video (owner)
- `DELETE /videos/:id` — Soft delete (owner/admin)
- `POST /videos/:id/vote` — Like/dislike (auth)
- `DELETE /videos/:id/vote` — Remove vote
- `POST /videos/:id/flag` — Flag video (auth)
- `GET /videos/:id/comments` — List comments
- `POST /videos/:id/comments` — Add comment (auth)

### Channels
- `GET /channels/:id` — Channel profile + videos
- `PATCH /channels/:id` — Update channel (owner)
- `POST /channels/:id/subscribe` — Subscribe (auth)
- `DELETE /channels/:id/subscribe` — Unsubscribe

### Admin
- `GET /admin/flags` — List flags (admin)
- `PATCH /admin/flags/:id` — Review flag (admin)
- `PATCH /admin/channels/:id/suspend` — Suspend channel (admin)
- `DELETE /admin/channels/:id` — Delete channel (admin)
- `DELETE /admin/videos/:id` — Remove video (admin)

### Other
- `POST /upload` — File upload (auth)
- `DELETE /comments/:id` — Soft delete comment (owner/admin)
