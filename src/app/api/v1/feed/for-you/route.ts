import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth-helpers'

/**
 * GET /api/v1/feed/for-you
 *
 * Personalized video feed ranked by user affinity.
 *
 * Affinity score (per candidate video):
 *   +5 per shared TAG with the user's watch-history videos
 *   +3 per shared CATEGORY with watch history
 *   +4 if user is subscribed to the video's channel
 *   +2 if user has upvoted any video from this channel
 *   +1 recency bonus per 7 days since upload (cap +3)
 *   -10 if user has disliked this specific video (don't recommend it again)
 *
 * Excluded:
 *   - Videos the user has already watched (avoids re-recommending)
 *   - Videos the user has uploaded themselves (their own content)
 *   - Removed / non-ready videos
 *
 * Fallbacks:
 *   - Unauthenticated request -> returns trending (same shape)
 *   - Authenticated but no watch history -> returns trending
 *
 * Query params:
 *   ?limit=20  (max 50, default 20)
 */

interface ScoredVideo {
  id: string
  score: number
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = parseInt(searchParams.get('limit') || '20', 10)
    const limit = Math.min(Math.max(limitParam || 20, 1), 50)

    const user = await getCurrentUser()

    // No auth -> fall back to trending
    if (!user) {
      return await trendingFallback(limit)
    }

    // --- Build the user's affinity profile from their activity ---

    // 1. Watch history (last 50 videos watched)
    const history = await db.watchHistory.findMany({
      where: { userId: user.id },
      orderBy: { watchedAt: 'desc' },
      take: 50,
      select: {
        videoId: true,
        video: {
          select: {
            id: true,
            channelId: true,
            categories: { select: { category: { select: { id: true } } } },
            tags: { select: { tag: { select: { id: true } } } },
          },
        },
      },
    })

    // No history -> fall back to trending
    if (history.length === 0) {
      return await trendingFallback(limit)
    }

    // Aggregate tag + category affinities from history
    const watchedVideoIds = new Set(history.map((h) => h.videoId))
    const tagAffinity = new Map<string, number>() // tagId -> weight
    const categoryAffinity = new Map<string, number>() // categoryId -> weight
    const watchedChannelIds = new Set<string>()

    for (const h of history) {
      if (!h.video) continue
      watchedChannelIds.add(h.video.channelId)
      for (const vt of h.video.tags) {
        const tid = vt.tag.id
        tagAffinity.set(tid, (tagAffinity.get(tid) ?? 0) + 1)
      }
      for (const vc of h.video.categories) {
        const cid = vc.category.id
        categoryAffinity.set(cid, (categoryAffinity.get(cid) ?? 0) + 1)
      }
    }

    // 2. Subscriptions — channels the user is subscribed to
    const subscriptions = await db.subscription.findMany({
      where: { subscriberId: user.id },
      select: { channelId: true },
    })
    const subscribedChannelIds = new Set(subscriptions.map((s) => s.channelId))

    // 3. Upvotes — channels whose videos the user has liked
    const upvotes = await db.vote.findMany({
      where: { userId: user.id, voteType: 'like' },
      select: { video: { select: { channelId: true } } },
    })
    const likedChannelIds = new Set(upvotes.map((v) => v.video.channelId))

    // 4. Dislikes — videos the user has downvoted (exclude from feed)
    const dislikes = await db.vote.findMany({
      where: { userId: user.id, voteType: 'dislike' },
      select: { videoId: true },
    })
    const dislikedVideoIds = new Set(dislikes.map((v) => v.videoId))

    // --- Score candidate videos ---
    // Candidates: all ready, non-removed videos NOT uploaded by the user,
    // NOT already watched, NOT disliked.
    //
    // Performance: previously this fetched ALL matching videos with 3
    // joins each, then scored them in JS. For a DB with 10k+ videos that
    // would OOM the serverless function and take seconds.
    //
    // Now we limit candidates to the most recent 200 videos (by createdAt)
    // plus the top 200 by views. This gives the scorer a reasonable pool
    // to work with (recency + popularity) without loading the entire
    // table. Cold-start videos (low views, recent upload) are still
    // included via the recency half.
    const now = Date.now()

    const [recentCandidates, popularCandidates] = await Promise.all([
      db.video.findMany({
        where: {
          isRemoved: false,
          status: 'ready',
          channel: { userId: { not: user.id } },
          id: { notIn: Array.from(watchedVideoIds) },
        },
        include: {
          channel: {
            select: {
              id: true,
              channelName: true,
              user: { select: { avatarUrl: true } },
            },
          },
          categories: {
            select: { category: { select: { id: true, name: true, slug: true } } },
          },
          tags: {
            select: { tag: { select: { id: true, name: true, label: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      db.video.findMany({
        where: {
          isRemoved: false,
          status: 'ready',
          channel: { userId: { not: user.id } },
          id: { notIn: Array.from(watchedVideoIds) },
        },
        include: {
          channel: {
            select: {
              id: true,
              channelName: true,
              user: { select: { avatarUrl: true } },
            },
          },
          categories: {
            select: { category: { select: { id: true, name: true, slug: true } } },
          },
          tags: {
            select: { tag: { select: { id: true, name: true, label: true } } },
          },
        },
        orderBy: { viewCount: 'desc' },
        take: 200,
      }),
    ])

    // Deduplicate by id (a video could appear in both halves)
    const seen = new Set<string>()
    const candidates = [...recentCandidates, ...popularCandidates].filter((v) => {
      if (seen.has(v.id)) return false
      seen.add(v.id)
      return true
    })

    const scored: ScoredVideo[] = []

    for (const video of candidates) {
      // Skip disliked videos
      if (dislikedVideoIds.has(video.id)) continue

      let score = 0

      // Tag affinity — strongest signal
      for (const vt of video.tags) {
        const w = tagAffinity.get(vt.tag.id) ?? 0
        if (w > 0) score += 5 * w
      }

      // Category affinity
      for (const vc of video.categories) {
        const w = categoryAffinity.get(vc.category.id) ?? 0
        if (w > 0) score += 3 * w
      }

      // Subscription boost
      if (subscribedChannelIds.has(video.channel.id)) {
        score += 4
      }

      // Upvote-channel boost (user has liked this channel's content before)
      if (likedChannelIds.has(video.channel.id)) {
        score += 2
      }

      // Recency bonus — +1 per 7 days since upload, cap +3 (i.e., 21 days max bonus)
      const ageDays = (now - video.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      const recencyBonus = Math.max(0, Math.min(3, Math.floor((21 - ageDays) / 7)))
      score += recencyBonus

      // Always include, even with score 0 — gives cold-start videos a chance
      // and ensures the feed has content even when affinity is low.
      scored.push({ id: video.id, score })
    }

    // Build lookup Maps so the sort tiebreaker and formatting step are O(1)
    // per lookup instead of O(n) via Array.find. With 400 candidates the
    // previous find-inside-sort was ~2.8M operations per request.
    const viewCountById = new Map(candidates.map((v) => [v.id, v.viewCount]))
    const scoreById = new Map(scored.map((s) => [s.id, s.score]))

    // Sort by score desc, then by viewCount desc as a tiebreaker
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      // Tiebreaker: more-viewed video first
      const aViews = viewCountById.get(a.id) ?? 0
      const bViews = viewCountById.get(b.id) ?? 0
      return bViews - aViews
    })

    // Apply limit
    const topIds = scored.slice(0, limit).map((s) => s.id)
    const topSet = new Set(topIds)
    const topVideos = candidates.filter((v) => topSet.has(v.id))

    // Preserve the sorted order from `scored` (candidates may be in any order)
    const topIdIndex = new Map(topIds.map((id, i) => [id, i]))
    topVideos.sort((a, b) => (topIdIndex.get(a.id) ?? 0) - (topIdIndex.get(b.id) ?? 0))

    const formattedVideos = topVideos.map((v) => ({
      ...v,
      categories: v.categories.map((vc) => vc.category),
      tags: v.tags.map((vt) => vt.tag),
      // Include the score for debugging / UI affordances ("Because you watched…")
      _forYouScore: scoreById.get(v.id) ?? 0,
    }))

    return NextResponse.json({
      videos: formattedVideos,
      personalized: true,
      debug: {
        watchedCount: watchedVideoIds.size,
        tagAffinitySize: tagAffinity.size,
        categoryAffinitySize: categoryAffinity.size,
        subscriptions: subscribedChannelIds.size,
        likedChannels: likedChannelIds.size,
      },
    })
  } catch (error) {
    console.error('For-you feed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Fallback for unauthed users or users with no watch history.
 * Returns the same shape as the personalized response but flagged
 * `personalized: false` so the UI can label it appropriately.
 */
async function trendingFallback(limit: number) {
  const videos = await db.video.findMany({
    where: { isRemoved: false, status: 'ready' },
    include: {
      channel: {
        select: {
          id: true,
          channelName: true,
          user: { select: { avatarUrl: true } },
        },
      },
      categories: {
        select: { category: { select: { id: true, name: true, slug: true } } },
      },
      tags: {
        select: { tag: { select: { id: true, name: true, label: true } } },
      },
    },
    orderBy: [{ viewCount: 'desc' }, { likeCount: 'desc' }],
    take: limit,
  })

  const formattedVideos = videos.map((v) => ({
    ...v,
    categories: v.categories.map((vc) => vc.category),
    tags: v.tags.map((vt) => vt.tag),
  }))

  return NextResponse.json({
    videos: formattedVideos,
    personalized: false,
  })
}
