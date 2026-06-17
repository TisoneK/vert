# Vert — Technical Specification
**Engineering Reference**
*Last updated: 6 June 2026 (updated)*

---

## 1. Architecture Decision: Modular Monolith

**Decision: Start with a well-structured modular monolith.**

A single deployable backend with clearly separated internal modules: `auth`, `video`, `users`, `subscriptions`, `notifications`, `moderation`, `categories`, `playlists`, `discovery`. Each module owns its routes, controllers, services, and types. No shared state between modules except through defined service interfaces.

**Rationale:**

A 2025 CNCF survey found that 42% of organizations that adopted microservices are consolidating back into larger deployable units — driven by cost and operational overhead, not technical limitations. Amazon Prime Video moved from distributed microservices to a monolith and cut infrastructure costs by 90%. Twilio's Segment collapsed 140+ microservices into one after engineers spent most of their time on ops rather than features.

For a 1–3 person team at MVP stage, a modular monolith means: one deployment to manage, one codebase to debug, fast iteration, and no distributed tracing overhead. When specific bottlenecks emerge — video encoding, search, notifications — those modules can be extracted as standalone services. Not before.

---

## 2. Full Tech Stack

### 2.1 Backend

| Component | Technology | Rationale |
|---|---|---|
| Runtime | Node.js v22 LTS | Async-first; ideal for I/O-heavy video APIs; massive ecosystem |
| Framework | Express.js | Lightweight, flexible, well-documented |
| Language | TypeScript | Type safety reduces bugs; required for a multi-developer project |
| API Style | REST (core) + WebSockets (real-time) | REST for all standard endpoints; WebSockets only for live comment feeds |
| API Versioning | All routes prefixed `/api/v1/` | Enables non-breaking future version |

### 2.2 Database

**Primary: PostgreSQL**

Vert's data is highly relational: users → channels → videos → comments → likes → subscriptions → categories → playlists → watch history → saved videos → moderation actions. PostgreSQL provides ACID compliance, complex joins, and referential integrity — critical for revenue calculations, moderation logs, and subscription states. Schema is well-defined from day one; there is no case for a document database here.

**ORM: Drizzle ORM** *(preferred)* or Prisma
- Drizzle: performant, SQL-close syntax, TypeScript-native; preferred for teams comfortable with SQL
- Prisma: easier onboarding; strong migration tooling; acceptable alternative

**Managed hosting options:** Supabase, Neon, or Railway (all offer free tiers sufficient for MVP)

**Cache & Session Layer: Redis (via Upstash)**
- Cache: video metadata, channel stats, trending/feed queries, category listings
- Sessions: user session storage, rate-limiting counters
- Pub/Sub: real-time notification delivery to WebSocket connections

### 2.3 Frontend (Web)

| Component | Technology |
|---|---|
| Framework | React 19 |
| Styling | Tailwind CSS v4 |
| State Management | Zustand (client state) + React Query (server state) |
| Video Player | Video.js or HLS.js — both compatible with Cloudflare Stream / Mux HLS output |
| Build Tool | Vite |

**Portrait-first UI requirement:** Portrait is the primary and default format. The default layout renders portrait videos in a 9:16 container. On mobile: `width: auto; max-height: 100vh`, centered. On desktop: portrait crop preserved with neutral background fill on sides. No letterboxing. Landscape videos play in a 16:9 container; square videos play in a 1:1 container. The layout adapts to the video's aspect ratio — portrait videos are visually prioritized in feeds and discovery, while landscape and square videos are displayed in their native aspect ratios.

### 2.4 Mobile App

**Framework: React Native with Expo**

React Native is preferred over Flutter for two reasons: TypeScript/JavaScript code and logic reuse with the web frontend (API clients, state management, validation), and a talent pool 3–5× larger than Flutter's Dart ecosystem.

React Native's New Architecture (Fabric + TurboModules) is now the default in 2026, closing the performance gap with Flutter significantly.

Expo is strongly recommended: faster development cycle, OTA updates, and simplified deployment to both App Store and Play Store via Expo EAS.

### 2.5 Video Infrastructure

**Phase 1 (MVP): Cloudflare Stream**

| Metric | Detail |
|---|---|
| Pricing | $5 / 1,000 min stored + $1 / 1,000 min delivered |
| Encoding fees | None — transcoding included |
| Output format | HLS (adaptive bitrate) |
| Player | Embedded; token-based access control |
| CDN | Cloudflare global network |
| Portrait support | Native — no configuration required for 9:16 |
| Landscape / Square support | Native — all aspect ratios are transcoded to HLS |
| Est. cost at MVP scale | ~$75/month (10,000 stored min + 50,000 delivered min) |

**Phase 2 (Growth): Migrate to Mux**
When per-viewer quality analytics (rebuffering rates, startup time, QoE) become critical. Mux offers 100,000 free delivery minutes/month on the self-serve plan, which can reduce costs at mid-scale.

**Phase 3 (Scale): Self-hosting**
FFmpeg encoding pipeline → Cloudflare R2 or S3 storage → custom CDN. Viable at high volume but requires a dedicated infrastructure engineer. Not appropriate until platform is generating consistent revenue (target: $5,000+/month).

**Upload Flow:**

```
User device
    │
    ▼
POST /api/v1/videos (metadata + aspect ratio classification)
    │
    ▼
Cloudflare Stream: generate presigned direct upload URL
    │
    ▼
Client uploads file directly to Cloudflare Stream (bypasses Vert backend)
    │
    ▼
Cloudflare Stream: transcodes to HLS
    │
    ▼
Webhook → POST /api/v1/webhooks/stream (Cloudflare notifies Vert backend)
    │
    ├─── Transcoding failed → video status set to "error"; creator notified
    │
    ▼
Vert backend: classify format (portrait/landscape/square) from metadata;
set format field; video status set to "ready"
    │
    ▼
Video appears on platform
```

This flow avoids routing video binary data through the Vert backend entirely, keeping infrastructure costs and server load low.

**Portrait-First Format Policy:**
- Portrait (9:16) is the default and featured format. Landscape (16:9) and square (1:1) are also accepted. All formats are transcoded to HLS.
- Client-side: aspect ratio is detected before upload begins to classify the video as portrait, landscape, or square (UX guidance only — not a security control).
- Server-side: format is determined from Cloudflare Stream metadata in the transcoding webhook and recorded in the video's `format` field. All three formats are accepted and published. Portrait videos are prioritized in feed placement and discovery.
- Do not rely on client-side classification alone.

### 2.6 Authentication

**Do not build a custom auth system.** Custom auth is one of the most common early mistakes. Auth done wrong creates security vulnerabilities that are expensive to fix post-launch.

**Recommended: Clerk** *(primary)* or Supabase Auth *(if using Supabase for PostgreSQL)*

- Handles: password hashing, MFA, rate limiting, social logins (Google, Apple), magic links, session management
- Issues standard JWTs validated by the Node.js backend on every protected request
- Clerk has excellent React + React Native SDKs

**Auth flow:**

```
Client → Clerk (login / signup)
           │
           ▼
       Clerk issues JWT (access token: 15min TTL)
       + refresh token (30-day TTL)
           │
           ▼
Client → Vert API (Authorization: Bearer <JWT>)
           │
           ▼
       Backend validates JWT signature + expiry
       Reads role claim from payload
           │
           ▼
       Authorized request proceeds
```

**JWT role claims:**

| Claim | Value | Notes |
|---|---|---|
| `role` | `member` \| `admin` | Set at registration; admin set manually |
| `is_channel` | Not in JWT | Channel status stored in DB only; check DB on relevant requests |

### 2.7 Email Notifications

**Service: Resend** *(MVP)* or Postmark *(scale)*

- Resend: 3,000 emails/month free; developer-friendly API; React Email for templates
- Postmark: more reliable for high-volume transactional delivery

**Notification triggers:**

| Event | Recipient | Template |
|---|---|---|
| New upload from subscribed channel | Subscriber (if opted in) | New video from [Channel] |
| Video flagged | Admin | Flag review required |
| Channel suspended | Channel owner | Account notice |
| Channel removed | Channel owner | Account notice |
| Revenue payout processed | Channel owner | Payout confirmation |

### 2.8 Search

| Phase | Implementation |
|---|---|
| MVP | PostgreSQL full-text search (`tsvector` on title + description) + category filtering |
| Growth | Typesense (open-source, self-hostable, fast) |
| Scale | Algolia (managed, paid) |

---

## 3. Data Models

All models use PostgreSQL. UUIDs as primary keys throughout.

```sql
-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT,                        -- NULL if OAuth-only
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  avatar_url    TEXT,
  oauth_provider TEXT,                       -- 'google' | 'apple' | NULL
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Channels (one per user; created on first video upload)
CREATE TABLE channels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  channel_name    TEXT NOT NULL,
  description     TEXT,
  banner_url      TEXT,
  subscriber_count INT NOT NULL DEFAULT 0,
  video_count     INT NOT NULL DEFAULT 0,
  is_suspended    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Videos
CREATE TABLE videos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id          UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  cf_video_id         TEXT NOT NULL UNIQUE,  -- Cloudflare Stream video ID
  thumbnail_url       TEXT,
  duration_seconds    INT,
  aspect_ratio        TEXT NOT NULL DEFAULT '9:16',
  format              TEXT NOT NULL DEFAULT 'portrait' CHECK (format IN ('portrait', 'landscape', 'square')),
  status              TEXT NOT NULL DEFAULT 'processing'
                        CHECK (status IN ('processing', 'ready', 'error', 'removed')),
  view_count          BIGINT NOT NULL DEFAULT 0,
  like_count          INT NOT NULL DEFAULT 0,
  dislike_count       INT NOT NULL DEFAULT 0,
  is_removed          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comments
CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id    UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_removed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Votes (likes and dislikes)
CREATE TABLE votes (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id    UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  vote_type   TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)             -- one vote per user per video
);

-- Subscriptions
CREATE TABLE subscriptions (
  subscriber_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id          UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (subscriber_id, channel_id)
);

-- Flags
CREATE TABLE flags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id     UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  reported_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason       TEXT NOT NULL CHECK (reason IN (
                  'spam', 'nudity', 'hate_speech',
                  'violence', 'misinformation', 'other'
               )),
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin action log
CREATE TABLE admin_actions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID NOT NULL REFERENCES users(id),
  target_type  TEXT NOT NULL CHECK (target_type IN ('video', 'channel', 'comment', 'flag')),
  target_id    UUID NOT NULL,
  action       TEXT NOT NULL,               -- e.g. 'suspend_channel', 'remove_video'
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Video categories (many-to-many)
CREATE TABLE video_categories (
  video_id    UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, category_id)
);

-- Playlists
CREATE TABLE playlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id  UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Playlist items
CREATE TABLE playlist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  video_id    UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  position    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Watch history
CREATE TABLE watch_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id   UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  watched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  progress   REAL DEFAULT 0  -- 0.0 to 1.0, how much of the video was watched
);

-- Watch later / saved videos
CREATE TABLE saved_videos (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id   UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);
```

**Key indexes (add at migration time):**

```sql
CREATE INDEX idx_videos_channel_id ON videos(channel_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_format ON videos(format);
CREATE INDEX idx_comments_video_id ON comments(video_id);
CREATE INDEX idx_flags_status ON flags(status);
CREATE INDEX idx_subscriptions_channel_id ON subscriptions(channel_id);
CREATE INDEX idx_video_categories_category_id ON video_categories(category_id);
CREATE INDEX idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX idx_saved_videos_user_id ON saved_videos(user_id);
```

---

## 4. API Reference (MVP Scope)

All endpoints are prefixed `/api/v1/`. Auth header where required: `Authorization: Bearer <JWT>`.

### Auth

| Method | Endpoint | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| POST | `/auth/signup` | None | `{ email, username, password }` | `201 { user_id }` | Triggers verification email |
| POST | `/auth/login` | None | `{ email, password }` | `200 { access_token, refresh_token }` | |
| POST | `/auth/refresh` | None | `{ refresh_token }` | `200 { access_token }` | |
| POST | `/auth/logout` | Member | — | `204` | Invalidates refresh token |

### Videos

| Method | Endpoint | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| GET | `/videos` | Optional | Query: `?page&limit&channel_id&category&format` | `200 { videos[], total }` | Paginated feed; filter by category and format |
| GET | `/videos/:id` | Optional | — | `200 { video, channel }` | |
| POST | `/videos` | Member | `{ title, description, categories? }` | `200 { upload_url, video_id }` | Returns Cloudflare presigned URL |
| PATCH | `/videos/:id` | Member (owner) | `{ title?, description?, categories? }` | `200 { video }` | |
| DELETE | `/videos/:id` | Member (owner) | — | `204` | Soft delete; sets status = 'removed' |
| POST | `/videos/:id/vote` | Member | `{ vote_type: 'like'\|'dislike' }` | `200 { like_count, dislike_count }` | Replaces existing vote |
| DELETE | `/videos/:id/vote` | Member | — | `200 { like_count, dislike_count }` | Remove vote |

### Categories

| Method | Endpoint | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| GET | `/categories` | Optional | — | `200 { categories[] }` | List all categories |
| GET | `/categories/:slug/videos` | Optional | Query: `?page&limit` | `200 { videos[], total }` | Videos in category |

### Trending

| Method | Endpoint | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| GET | `/trending` | Optional | Query: `?category&limit` | `200 { videos[] }` | Trending videos; optional category filter |

### Comments

| Method | Endpoint | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| GET | `/videos/:id/comments` | Optional | Query: `?page&limit` | `200 { comments[], total }` | |
| POST | `/videos/:id/comments` | Member | `{ content }` | `201 { comment }` | |
| DELETE | `/comments/:id` | Member (owner) | — | `204` | Soft delete |

### Flags

| Method | Endpoint | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| POST | `/videos/:id/flag` | Member | `{ reason }` | `201 { flag_id }` | One flag per user per video |

### Channels

| Method | Endpoint | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| GET | `/channels/:id` | Optional | — | `200 { channel, videos[] }` | |
| PATCH | `/channels/:id` | Member (owner) | `{ channel_name?, description?, banner_url? }` | `200 { channel }` | |
| POST | `/channels/:id/subscribe` | Member | `{ email_notifications: bool }` | `201` | |
| DELETE | `/channels/:id/subscribe` | Member | — | `204` | |

### Playlists

| Method | Endpoint | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| GET | `/playlists/:id` | Optional | — | `200 { playlist, videos[] }` | Get playlist and its videos |
| POST | `/playlists` | Member | `{ title, description?, is_public? }` | `201 { playlist }` | Create playlist |
| PATCH | `/playlists/:id` | Member (owner) | `{ title?, description?, is_public? }` | `200 { playlist }` | Update playlist |
| POST | `/playlists/:id/items` | Member (owner) | `{ video_id, position? }` | `201 { item }` | Add video to playlist |
| DELETE | `/playlists/:id/items/:video_id` | Member (owner) | — | `204` | Remove video from playlist |

### Watch History

| Method | Endpoint | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| GET | `/history` | Member | Query: `?page&limit` | `200 { videos[] }` | User's watch history |
| DELETE | `/history` | Member | — | `204` | Clear all history |
| DELETE | `/history/:video_id` | Member | — | `204` | Remove specific entry |

### Saved / Watch Later

| Method | Endpoint | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| GET | `/saved` | Member | Query: `?page&limit` | `200 { videos[] }` | User's saved videos |
| POST | `/videos/:id/save` | Member | — | `201` | Save video |
| DELETE | `/videos/:id/save` | Member | — | `204` | Unsave video |

### Related Videos

| Method | Endpoint | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| GET | `/videos/:id/related` | Optional | Query: `?limit` | `200 { videos[] }` | Related videos (same category, same channel) |

### Webhooks

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/webhooks/stream` | Cloudflare signature | Handles transcoding complete / failed events; sets format field from metadata |

### Admin

| Method | Endpoint | Auth | Request Body | Response | Notes |
|---|---|---|---|---|---|
| GET | `/admin/flags` | Admin | Query: `?status&page` | `200 { flags[] }` | |
| PATCH | `/admin/flags/:id` | Admin | `{ status, notes? }` | `200` | Update flag review status |
| PATCH | `/admin/channels/:id/suspend` | Admin | `{ reason }` | `200` | Sets is_suspended = true |
| DELETE | `/admin/channels/:id` | Admin | `{ reason }` | `204` | Permanently removes channel + videos |
| DELETE | `/admin/videos/:id` | Admin | `{ reason }` | `204` | Remove single video |

### Standard Error Responses

All errors follow this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descriptive error message.",
    "status": 400
  }
}
```

| HTTP Status | Meaning |
|---|---|
| 400 | Bad request / validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (authenticated but insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate vote, duplicate flag) |
| 422 | Unprocessable entity |
| 500 | Internal server error |

---

## 5. Architecture Decision Record (ADR)

| # | Decision | Options Considered | Chosen | Rationale |
|---|---|---|---|---|
| ADR-001 | Backend architecture | Microservices vs. Modular Monolith | Modular Monolith | Lower ops overhead; right for 1–3 person team; modules extractable later |
| ADR-002 | Database | PostgreSQL vs. MongoDB | PostgreSQL | Highly relational data; well-defined schema from day one |
| ADR-003 | ORM | Prisma vs. Drizzle | Drizzle (preferred) | Performant; SQL-close; TypeScript-native |
| ADR-004 | Mobile framework | React Native vs. Flutter | React Native + Expo | Code reuse with web; larger TypeScript talent pool |
| ADR-005 | Video hosting (MVP) | Cloudflare Stream vs. Mux vs. Bunny | Cloudflare Stream | Simplest pricing; fast setup; no encoding fees |
| ADR-006 | Auth | Custom vs. Clerk vs. Supabase Auth | Clerk | Handles complexity; React + RN SDKs; secure by default |
| ADR-007 | Search (MVP) | PostgreSQL FTS vs. Typesense vs. Algolia | PostgreSQL FTS | No extra infrastructure at MVP; sufficient for title/description search |
| ADR-008 | Email | SendGrid vs. Resend vs. Postmark | Resend | Free tier; developer-friendly; React Email templates |
| ADR-009 | Video format policy | Portrait-only vs. Portrait-first with multi-format support | Portrait-first (primary identity) with landscape/square support | Portrait remains the platform's identity and featured format; supporting landscape/square increases content breadth and creator flexibility without diluting the brand |
| ADR-010 | Discovery model | Chronological only vs. Category-based + Trending | Category-based + Trending (Dailymotion-style) | Category-based discovery and trending sections significantly improve content findability and user engagement; chronological-only feed limits discoverability at scale |

---

## 6. Hosting & Infrastructure

| Service | Provider | Est. Monthly Cost |
|---|---|---|
| Backend (Node.js) | Railway or Render | $5–$20 |
| PostgreSQL | Supabase / Neon / Railway | $0–$25 (free tiers available) |
| Redis | Upstash (serverless) | $0–$10 |
| Video Hosting | Cloudflare Stream | ~$75 (at MVP scale) |
| Auth | Clerk | $0 (free up to 10K MAU) |
| Email | Resend | $0 (up to 3K/month) |
| CDN / DNS | Cloudflare | $0 (free tier) |
| Mobile CI/CD | Expo EAS | $0–$29 |
| **Total (MVP)** | | **~$80–$160/month** |

Video delivery is the dominant cost driver and scales directly with viewership. Monitor Cloudflare Stream delivery minutes weekly from day one.

---

## 7. Build Phases

### Phase 1 — Web MVP (8–12 weeks)

**Prerequisites before Phase 2 begins:** All items below must be complete and tested.

- [ ] User auth (sign up, login, Google OAuth, email verification)
- [ ] Video upload → Cloudflare Stream integration (including webhook handler)
- [ ] Server-side format classification (portrait/landscape/square) from webhook metadata
- [ ] Landscape and square video format support
- [ ] Video feed (chronological, paginated)
- [ ] Video playback (portrait-first player; adaptive container for landscape/square)
- [ ] Channel profiles and channel page
- [ ] Likes, dislikes, comments
- [ ] Channel subscriptions + email notifications
- [ ] Video flagging (member-only)
- [ ] Admin dashboard: flag review, suspend/remove channel, remove video
- [ ] Admin action log
- [ ] Category system and category browse pages
- [ ] Trending section
- [ ] Related videos on video detail page
- [ ] Watch history
- [ ] Save / Watch Later
- [ ] Creator video manager (basic analytics: view count, engagement)

### Phase 2 — Mobile App (6–10 weeks after Phase 1 complete)

- [ ] React Native (Expo) app for iOS + Android
- [ ] Full feature parity with web MVP
- [ ] Push notifications via Expo Push Notifications
- [ ] Portrait-optimised native video player
- [ ] App Store + Play Store submission

### Phase 3 — Monetization Layer (post-launch, timing TBD)

- [ ] Ad network integration (AdPlayer.Pro initially; Google AdSense when eligible)
- [ ] Creator revenue dashboard (views, estimated earnings, payout history)
- [ ] Payout system via Stripe Connect
- [ ] Creator tier management (Starter / Partner / Pro / Premium)

---

## 8. Development Cost Estimate

| Approach | Estimated Cost | Timeline |
|---|---|---|
| AI builder scaffold + developer cleanup | ~$500–$2,000 (hosting + tools + dev time) | 3–8 weeks for working MVP |
| Freelancer (single mid-level developer) | $8,000–$20,000 | 3–5 months |
| Small agency (3–5 person team) | $40,000–$80,000 | 3–6 months |
| In-house team | Salary-dependent | Ongoing |

**Recommended approach:** AI builder to generate base scaffold → developer reviews, secures, and deploys. This hybrid approach can reduce costs by 40–60% while maintaining code quality control. The AI builder platform will be evaluated (Eric's tool vs. GLM 5.1) via a base code generation test before committing.

---

## 9. Technical Risks & Mitigations

| Risk | Mitigation |
|---|---|
| AI-generated code quality | Review all output; manually test auth, upload pipeline, and moderation flows before launch |
| Video storage costs | Enforce 500MB / 10min limits at MVP; monitor delivery minutes weekly; alert at cost thresholds |
| Format classification accuracy | Server-side format determination from Cloudflare Stream webhook metadata — do not rely on client-side only |
| Spam / bot accounts | Rate limiting on signup; CAPTCHA; email verification required before any interaction |
| Admin tooling neglected | Build flagging dashboard in Phase 1 — content moderation is a legal requirement, not optional UX |
| Scaling video delivery | Cloudflare Stream CDN for MVP; evaluate Mux at $1,000+/month delivery costs |
| Webhook security | Validate Cloudflare webhook signatures on every inbound request — reject unsigned payloads |
| Scaling at growth stage | Stateless design from day one; Redis for sessions; horizontal scaling path; PgBouncer for connection pooling; read replicas at 100K MAU |
| Cache consistency | Cache invalidation on every write; defined TTLs per data type; trending computed by scheduled job |

---

## 10. Scalability Architecture

Vert must be designed to handle traffic growth from MVP (hundreds of users) to critical scale (millions of monthly active users) without architectural rewrites. The modular monolith is the starting point, but every module must be extractable into a standalone service when its load warrants it.

### Scaling Stages

| Stage | MAU | Key Actions |
|-------|-----|-------------|
| MVP | 0–50K | Single server; SQLite → PostgreSQL; Cloudflare Stream; Redis cache |
| Growth | 50K–500K | Horizontal scaling (2–4 app instances); PostgreSQL read replica; PgBouncer connection pooling; Redis cluster |
| Scale | 500K–5M | Module extraction (video processing → separate service; search → Typesense/Algolia); CDN optimization; database sharding consideration |
| Critical | 5M+ | Full microservices for high-load modules; multi-region deployment; custom video pipeline (FFmpeg → R2/S3 → CDN) |

### Stateless Design Principles

- All session state in Redis (via Upstash), never in in-process memory
- No sticky sessions — any app instance can serve any request
- File uploads go directly to Cloudflare Stream (bypass app servers)
- Webhook handlers are idempotent (safe to receive duplicate events)

### Database Scaling Path

- MVP: Single PostgreSQL instance (Supabase/Neon managed)
- Growth: Add read replica; route read-heavy queries (feed, trending, search) to replica
- Scale: PgBouncer for connection pooling; consider Citus for horizontal sharding
- Critical: Separate databases by module if needed (e.g., analytics DB, moderation DB)

### Video Delivery Scaling

- Cloudflare Stream handles CDN natively — no separate CDN config needed at MVP
- At $1,000+/month delivery costs, evaluate Mux for better per-viewer QoE analytics
- At $5,000+/month, evaluate self-hosted pipeline (FFmpeg → R2 → custom CDN) for cost control
- Direct-to-CDN upload flow (presigned URLs) ensures upload traffic never hits app servers

### Caching Strategy

- Feed queries: cached in Redis, TTL 60 seconds, invalidated on new video upload
- Trending: cached in Redis, TTL 300 seconds (5 min), computed by scheduled job
- Channel stats: cached in Redis, TTL 120 seconds, invalidated on video upload/vote/subscribe
- Video metadata: cached in Redis, TTL 600 seconds, invalidated on video update

### Module Extraction Triggers

Each module in the monolith should be extracted into a standalone service when:
- It exceeds 30% of total CPU time
- It has fundamentally different scaling requirements than the core app
- It needs independent deployment cycles

Extraction order (likely): video processing → search → notifications → analytics

### Infrastructure Cost Triggers

| Metric | Threshold | Action |
|--------|-----------|--------|
| Cloudflare Stream delivery | $1,000/month | Evaluate Mux migration |
| Database connections | >100 concurrent | Add PgBouncer |
| App CPU usage | >70% sustained | Add app instances (horizontal) |
| Video delivery | $5,000/month | Evaluate self-hosted pipeline |
| Search latency | >200ms p95 | Migrate to Typesense |

---

*Sources: CNCF Survey 2025 (microservices consolidation), TechAhead / SharpSkill (Flutter vs React Native 2026), Cloudflare / Mux / Blazing CDN (video pricing Q2 2026), Windframe.dev (PostgreSQL vs MongoDB 2026), Clutch.co / DevOptiv (MVP cost data 2026), Duende / Meerako (auth best practices 2025).*
