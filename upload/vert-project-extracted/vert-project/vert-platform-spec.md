# Vert — Portrait Video Platform
**Product & Market Specification**
*Last updated: 6 June 2026 (updated)*

---

## 1. Project Overview

Vert is a video-sharing platform built for **portrait/vertical ("vert") video as its primary format and identity** — defined as any video shot in 9:16 portrait orientation. While TikTok, YouTube Shorts, and Instagram Reels support vertical video, none are built around it as their defining format. Vert fills that gap with a YouTube-style experience — open channels, ad revenue sharing, and UGC — designed primarily around portrait video, while also accepting landscape and square formats. Portrait is the default and featured format; landscape and square content are supported but secondary.

---

## 2. Market Opportunity

### Vertical Video Is the Dominant Format

- Over 90% of mobile content is now created and consumed in portrait orientation. People hold their phones vertically 94–96% of the time, and fewer than 30% will rotate their device to watch horizontal video.
- Vertical video delivers roughly **2.5× higher engagement** than horizontal formats in comparable short-form contexts.
- Vertical video ad inventory commands **25–40% higher CPM rates** than standard display ads.
- CNN launched a dedicated vertical video feed in late 2025; publishers increasingly treat vertical as a first-class format, not a mobile afterthought.

### The Niche Is Validated but Not Owned

- No existing platform is **exclusively** built for vertical video. TikTok, YouTube Shorts, Instagram Reels, and Snapchat all support it — but as a feature, not an identity.
- The closest direct competitor is **Vurt** (myvurt.com), a mobile-first vertical streaming platform for indie filmmakers, launched March 2026. Vurt focuses on scripted micro-series using a curated content model — not open UGC or ad revenue sharing.
- The micro-drama segment (ReelShort, DramaBox) proves appetite for vertical-exclusive content at scale. ReelShort projected $1.2 billion in gross consumer spending in 2025; DramaBox reached $276 million. TikTok launched its own micro-drama app in January 2026.
- The short video platforms market is dominated by ad-based monetization (~75% of revenue) and mobile-first apps (~80% of market share in 2026) — both aligning directly with Vert's model.

### Market Size

- Global video streaming revenue is projected to grow from ~$191.6 billion in 2026 to over $865 billion by 2034 (~21% CAGR).
- Creator economy ad spend reached $29.5 billion in 2024 and is projected at $37 billion for 2025 — a 26% YoY increase, growing 4× faster than traditional media.

---

## 3. Competitive Landscape

| Platform | Vertical Video | UGC | Exclusive to Vertical | Open Channels | Ad Rev Share | Category-Based Discovery | Trending | Playlists | Creator Tools |
|---|---|---|---|---|---|---|---|---|---|
| TikTok | ✅ | ✅ | ❌ | ❌ | Partial | ✅ (hashtags) | ✅ | ❌ | ✅ |
| YouTube Shorts | ✅ | ✅ | ❌ | ✅ | ✅ (55/45) | ✅ | ✅ | ✅ | ✅ |
| Instagram Reels | ✅ | ✅ | ❌ | ❌ | Limited | ✅ (hashtags) | ✅ | ❌ | Limited |
| Snapchat | ✅ | ✅ | ❌ | ❌ | Limited | ✅ | ✅ | ❌ | Limited |
| Dailymotion | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vurt | ✅ | ❌ (curated) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Vert (proposed)** | ✅ | ✅ | Portrait-first (not exclusive) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Key differentiator:** Vert is the only platform combining portrait-first identity + open UGC channels + ad revenue sharing, with a Dailymotion-style feature set including categories, trending, playlists, and creator tools. No direct clone competitor exists.

**Note on Dailymotion-style feature set:** Vert adopts the Dailymotion approach to content discovery and creator empowerment — categories for browsing, trending sections, playlist organization, and creator studio tools — while maintaining portrait video as the platform's primary identity and featured format. This gives Vert the richness of a full-featured video platform without sacrificing its vertical-first distinction.

---

## 4. User Roles & Permissions

### Role Definitions

| Role | Description |
|---|---|
| Guest | Unauthenticated visitor. Can browse and watch videos. No account required. |
| Member | Registered user. Can interact with content and post videos. |
| Channel | Any member who has uploaded at least one video. Their profile becomes their channel. |
| Administrator | Platform staff. Can moderate content, manage channels, and review flagged content. |

### Permissions Matrix

| Feature | Guest | Member | Channel | Admin |
|---|---|---|---|---|
| Watch videos | ✅ | ✅ | ✅ | ✅ |
| Browse feed | ✅ | ✅ | ✅ | ✅ |
| View channel profiles | ✅ | ✅ | ✅ | ✅ |
| Share video link | ✅ | ✅ | ✅ | ✅ |
| Like / dislike | ❌ | ✅ | ✅ | ✅ |
| Comment | ❌ | ✅ | ✅ | ✅ |
| Flag video | ❌ | ✅ | ✅ | ✅ |
| Subscribe to channel | ❌ | ✅ | ✅ | ✅ |
| Upload video | ❌ | ✅ | ✅ | ✅ |
| Manage own channel | ❌ | ❌ | ✅ | ✅ |
| View revenue dashboard | ❌ | ❌ | ✅ | ✅ |
| Review flagged content | ❌ | ❌ | ❌ | ✅ |
| Suspend / remove channel | ❌ | ❌ | ❌ | ✅ |
| Remove any video | ❌ | ❌ | ❌ | ✅ |

---

## 5. Feature Specification

### 5.1 Video

- Portrait (9:16) is the **primary and featured format**. Landscape (16:9) and square (1:1) are also accepted. Portrait videos are prioritized in feed placement and discovery.
- Maximum file size: 500MB per upload (MVP).
- Maximum duration: 10 minutes per video (MVP).
- Supported formats: MP4, MOV. Other formats rejected with a clear error message.
- Videos are transcoded to HLS (adaptive bitrate) after upload. The video is not publicly visible until transcoding is confirmed complete.
- **Video metadata includes a `format` field** that records the aspect ratio classification: `portrait` (9:16), `landscape` (16:9), or `square` (1:1). This field is set automatically from the uploaded video's aspect ratio and is used to prioritize portrait content in feeds and discovery.

### 5.2 User Accounts

- Account is optional for viewing and sharing.
- Account is required to post, comment, like, dislike, flag, and subscribe.
- Registration: email/password or Google OAuth. Apple sign-in on mobile.
- Email verification is required before a member can post or interact.

### 5.3 Video Feed & Discovery

- **Default feed (logged out):** Most recent uploads, globally — chronological.
- **Default feed (logged in):** Blended feed — recent uploads from subscribed channels (weighted) + platform-wide recent content (fill).
- **Channel page:** All videos from that channel, newest first.
- **Search:** Title and description full-text search. Results ordered by relevance, then recency.
- MVP excludes a recommendation algorithm. Algorithmic ranking is a post-launch feature.

#### Categories

Videos can be assigned to categories. The predefined categories are:

**Music, Sports, Gaming, Entertainment, News, Education, Comedy, Tech, Travel, Food, Fitness, Art, Other**

- Each video can be assigned to one or more categories at upload time.
- Each category has its own browse page, showing videos in that category sorted by recency (with trending items surfaced at the top).
- Category browse pages are accessible to all users (guests and members).

#### Trending

- A **Trending** section showing videos with the highest engagement velocity (views + likes over the recent 24–48 hours).
- Trending is updated hourly via a scheduled computation job.
- Trending can be filtered by category (e.g., "Trending in Music").
- Accessible from the main navigation.

#### Recommended ("For You")

- A **"For You"** section offering personalized content suggestions.
- **MVP:** Recommendations based on categories the user has watched. If a user frequently watches Music and Gaming videos, the For You section surfaces recent and trending content from those categories.
- **Post-MVP:** Algorithmic recommendation engine based on watch history, engagement patterns, and collaborative filtering.

#### Explore Page

- An **Explore** page providing category-based browsing with featured/picked content, similar to Dailymotion's explore section.
- Each category is displayed with a thumbnail preview and video count.
- Featured/picked content is surfaced at the top of the Explore page (curated by admin or based on trending data).
- The Explore page is accessible from the main navigation and is the primary entry point for category-based discovery.

#### Related Videos

- On the video detail page, a **Related Videos** sidebar/section shows videos related to the current video.
- Related videos are determined by: same category as the current video, and/or same channel as the current video.
- Related videos are sorted by relevance (category match first, then recency).

### 5.4 Engagement

- **Likes and dislikes:** Thumbs up / thumbs down. One vote per user per video; switching is allowed. Counts are public.
- **Comments:** Text only. Threaded replies are a post-launch feature. Comments are visible to all; posting requires an account.
- **Sharing:** Any video has a shareable link accessible to guests. No in-app sharing/DMs at MVP.
- **Watch History:** Logged-in users can see their watch history — a chronological list of videos they have watched. Watch history tracks progress (how much of the video was viewed) to support resume playback. Users can clear their entire history or remove individual entries.
- **Save / Watch Later:** Users can save videos to a "Watch Later" list. This is a personal list accessible from the user's profile/navigation. Users can add or remove videos from the list at any time.

### 5.5 Channels & Subscriptions

- Any member who uploads a video automatically has a channel. There is no separate "apply to be a creator" step.
- Channel profile includes: channel name, description, banner image, avatar, video list, subscriber count.
- Members can subscribe to any channel.
- Subscribers can opt in to email notifications for new uploads from that channel.
- **Playlists:** Channels can organize their videos into playlists. A playlist has a title, optional description, and a public/private visibility setting. Videos can be added to playlists and reordered within them. **MVP:** Channels can create and manage playlists. **Post-MVP:** Public playlists are discoverable and searchable by other users.
- **Creator Studio:** A dedicated dashboard for channels providing:
  - **Video analytics:** Views over time, engagement rate (likes + comments relative to views), subscriber growth.
  - **Video manager:** Edit video metadata (title, description, category), delete videos, reorder videos on the channel page.
  - **Channel customization:** Edit channel name, description, banner image, and avatar.

### 5.6 Content Moderation

- Any logged-in member can flag a video for inappropriate content. Guests cannot flag.
- Flag reasons (select one): Spam, Nudity or sexual content, Hate speech, Violent or graphic content, Misinformation, Other.
- Flagged videos remain live until reviewed by an admin (no auto-takedown at MVP).
- Admins can: remove a single video, suspend a channel (channel and videos hidden), or permanently delete a channel and all its videos.
- All admin actions are logged with timestamp, admin ID, target, action type, and reason.

### 5.7 Content Guidelines (Summary)

The following content is prohibited and subject to removal:

- Nudity, sexual content, or content sexualising minors
- Graphic violence or gore
- Hate speech targeting individuals or groups based on protected characteristics
- Harassment, threats, or doxxing
- Spam or artificially inflated engagement
- Content that violates applicable law

Full community guidelines will be published as a separate document before launch.

---

## 6. Business Model

### Monetization: Ad Revenue Sharing

- Platform earns revenue through video advertising (pre-roll, mid-roll, display).
- Ad revenue is shared with eligible content creators.
- Industry benchmark: YouTube's 55/45 split (creator/platform). Vert will adopt a milestone-based model:

| Creator Tier | Monthly Views (channel) | Creator Share |
|---|---|---|
| Starter | < 50,000 | Not eligible |
| Partner | 50,000 – 500,000 | 45% |
| Pro | 500,000 – 5M | 50% |
| Premium | 5M+ | 55% |

This structure allows the platform to cover infrastructure costs at early stages while offering a clear path to competitive payouts as channels grow.

### Creator Eligibility Requirements

To qualify for revenue sharing, a channel must meet all of the following:

- Minimum 500 subscribers
- Minimum 50,000 views in the past 30 days
- Account in good standing (no active strikes or suspensions)
- Verified payment method on file
- Content compliant with community guidelines

### Ad Network Strategy

- **MVP / Early stage:** Direct brand deals with vertical-video-friendly brands; specialist networks such as AdPlayer.Pro that maintain vertical video ad inventory.
- **Growth stage:** Google AdSense for video (requires platform scale and review approval).
- **Scale:** Programmatic inventory via multiple ad networks; brand sponsorship layer.

Note: New platforms cannot access Google AdSense video inventory immediately. Direct deals are the primary revenue path at launch and should be pursued ahead of any public launch.

### Revenue Benchmarks

- Average CPM in 2026: $3.50–$6.15 per 1,000 views (platform side).
- Highly engaged audiences: $8–$15 CPM.
- Vertical/short-form content earns lower CPMs than long-form but compensates with higher volume and engagement frequency.

### Indicative Revenue Scenarios

| Monthly Views | Avg CPM (platform) | Gross Revenue | Creator Payout (45%) | Platform Net |
|---|---|---|---|---|
| 1,000,000 | $4.00 | $4,000 | $1,800 | $2,200 |
| 5,000,000 | $4.50 | $22,500 | $10,125 | $12,375 |
| 20,000,000 | $5.00 | $100,000 | $50,000 | $50,000 |

These are illustrative projections. Actual CPM varies by niche, geography, and ad network relationships.

---

## 7. Platform Scope

- **Web:** Browser-based (desktop and mobile browser). Portrait-first layout.
- **Mobile App:** iOS and Android native apps.
- Mobile-first design is essential: the entire use case is portrait-mode content on a handheld device.

---

## 8. MVP Scope vs. Post-Launch

### Included in MVP

- User registration and authentication
- Video upload (portrait/9:16 primary; landscape/16:9 and square/1:1 also accepted), transcoding, playback
- Feed (chronological), channel pages, search (title/description)
- Likes, dislikes, comments
- Channel subscriptions with optional email notifications
- Video flagging and admin moderation dashboard
- Basic channel/creator profile pages
- Categories for videos
- Trending section
- Watch history
- Save / Watch Later
- Creator video manager (basic analytics: view count, engagement)
- Related videos on video detail page

### Excluded from MVP (Post-Launch)

- Algorithmic video recommendation feed
- Threaded comment replies
- In-app messaging or sharing
- Public playlist discovery (playlists exist in MVP but are only visible on the channel page)
- Creator revenue dashboard and payouts
- Push notifications (mobile)
- Live streaming
- Video chapters or timestamps
- Clip or remix tools

---

## 9. Risks & Mitigations

| Risk | Notes | Mitigation |
|---|---|---|
| Content moderation at scale | UGC will attract inappropriate content | Build flagging dashboard before launch; publish clear guidelines; auto-flag keywords at scale |
| Storage and delivery costs | Video is expensive at scale | Enforce file size/duration limits at MVP; monitor delivery minutes weekly; build cost into monetization model |
| Creator acquisition | Empty platform won't attract viewers | Seed with invited creators pre-launch; curate initial content; offer early-partner terms |
| Ad network access | Google AdSense video unavailable to new platforms | Pursue direct brand deals first; use specialist vertical ad networks (AdPlayer.Pro) as bridge |
| Platform competition | Incumbents could add portrait-only modes at any time | Differentiation beyond format: open channels, rev share, creator community, dedicated UX |
| Regulatory exposure | User-generated content creates liability | DMCA takedown process, COPPA compliance, GDPR/privacy policy — required before launch |
| Scaling infrastructure | Traffic growth can outpace architecture | Stateless design from day one; Redis for session state; horizontal scaling path defined; module extraction triggers documented |

---

## 10. Scalability Requirement

The platform must be designed to scale from MVP traffic to millions of monthly users. Every architectural decision must account for growth without requiring a rewrite.

### Stateless Backend Design

- All session state is stored in Redis, not in in-process memory. Any app instance can serve any authenticated request.
- No sticky sessions are required. Requests from the same user can be served by different Node.js instances behind the load balancer.

### Horizontal Scaling

- Node.js instances are deployed behind a load balancer. Additional instances are added as traffic grows.
- No architectural changes are required to go from 1 instance to N instances. The stateless design ensures any instance can handle any request.

### Database Scaling Path

- **MVP:** Single PostgreSQL instance (Supabase/Neon managed).
- **Growth (>100K MAU):** Add read replicas for PostgreSQL. Read-heavy queries (feed, trending, search, channel pages) are routed to replicas. Write queries (uploads, votes, comments) continue to hit the primary.
- **Connection pooling:** PgBouncer is introduced when concurrent connections exceed ~100. This happens before read replicas in practice.

### Video Delivery

- **CDN-first architecture:** Cloudflare Stream handles CDN natively — no separate CDN configuration is needed at MVP.
- **Direct-to-CDN upload flow:** Video uploads go directly from the client to Cloudflare Stream via presigned URLs. Upload traffic never passes through the Vert backend, avoiding a bottleneck.
- **Cost-based migration path:** At $1,000+/month Cloudflare Stream delivery costs, evaluate Mux for better per-viewer QoE analytics. At $5,000+/month, evaluate a self-hosted pipeline (FFmpeg → R2/S3 → custom CDN) for cost control.

### Caching Strategy

- **Redis for hot queries:** Feed queries, trending data, and channel stats are cached in Redis.
- **Cache invalidation on write:** Whenever a video is uploaded, updated, or removed, the relevant cache entries are invalidated. This ensures freshness without sacrificing performance.
- **TTLs:** Feed cache TTL 60 seconds; trending cache TTL 300 seconds; channel stats TTL 120 seconds; video metadata TTL 600 seconds.

### Module Extraction Path

The modular monolith architecture explicitly anticipates that specific modules will become bottlenecks at scale. When they do, they are extracted from the monolith into standalone services. The criteria for extraction are:

- The module exceeds 30% of total CPU time.
- The module has fundamentally different scaling requirements than the core app.
- The module needs independent deployment cycles.

Likely extraction order: video processing → search → notifications → analytics.

### Infrastructure Cost Triggers

Defined thresholds for each scaling step ensure the team scales proactively, not reactively:

| Metric | Threshold | Action |
|---|---|---|
| Cloudflare Stream delivery costs | $1,000/month | Evaluate Mux migration |
| Database concurrent connections | >100 | Add PgBouncer |
| MAU | >100K | Add PostgreSQL read replicas |
| App CPU usage | >70% sustained | Add app instances (horizontal scaling) |
| Video delivery costs | $5,000/month | Evaluate self-hosted pipeline (FFmpeg → R2 → CDN) |
| Any single module CPU time | >30% of total | Extract module into standalone service |
| Search latency | >200ms p95 | Migrate to Typesense |

---

## 11. Open Decisions

| # | Decision | Options | Status |
|---|---|---|---|
| 1 | AI build platform | Eric's tool vs. GLM 5.1 — run base code generation test on both | Pending |
| 2 | Video hosting provider | Cloudflare Stream (recommended for MVP) | Pending confirmation |
| 3 | Ad network for launch | AdPlayer.Pro + direct deals | Pending outreach |
| 4 | Creator revenue payout provider | Stripe Connect (recommended) | Pending |
| 5 | Full content guidelines document | Draft required before launch | Not started |
| 6 | DMCA / legal compliance | Legal review required | Not started |
| 7 | Video format policy | Portrait-first with landscape/square support | Decided — Portrait is the primary and featured format; landscape (16:9) and square (1:1) are also accepted |
| 8 | Dailymotion-style feature set adoption | Option A: Keep portrait identity, add Dailymotion-style features (categories, trending, playlists, creator tools) | Decided — Option A |

---

*Sources: TechCrunch (Vurt launch, March 2026), AdPlayer.Pro Blog (vertical video 2026), Coherent Market Insights (short video platforms), Evadav (streaming market), Mux/Cloudflare Stream pricing data (Q2 2026), TubeAnalytics monetization report (2026), InfluenceFlow creator earnings data (2026).*
