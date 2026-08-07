'use client'
import Image from 'next/image'
import { isNextImageSafeUrl } from '@/lib/image-utils'
import { fetchWithRetry } from '@/lib/fetch-retry'
import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useNavigation, useAuth } from '@/lib/store'
import { VideoCard } from './VideoCard'
import { Film, Sparkles } from 'lucide-react'

interface Video {
  id: string
  title: string
  thumbnailUrl: string | null
  durationSeconds: number | null
  viewCount: number
  likeCount: number
  createdAt: string
  format: string
  channel: {
    id: string
    channelName: string
    user: { avatarUrl: string | null }
  }
  categories: Array<{ name: string; slug: string }>
  tags?: Array<{ name: string; label: string }>
}

interface Category {
  id: string
  name: string
  slug: string
  videoCount: number
}

async function fetchCategories(): Promise<Category[]> {
  const res = await fetchWithRetry('/api/v1/categories')
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`)
  const data = await res.json()
  return data.categories ?? []
}

async function fetchTrending(limit: number): Promise<Video[]> {
  const res = await fetch(`/api/v1/trending?limit=${limit}`)
  if (!res.ok) throw new Error(`Failed to fetch trending: ${res.status}`)
  const data = await res.json()
  return data.videos ?? []
}

async function fetchForYou(): Promise<Video[]> {
  const res = await fetch('/api/v1/feed/for-you?limit=12', { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch for-you: ${res.status}`)
  const data = await res.json()
  return data.personalized ? (data.videos ?? []) : []
}

async function fetchVideos(): Promise<Video[]> {
  const res = await fetch('/api/v1/videos?page=1&limit=24')
  if (!res.ok) throw new Error(`Failed to fetch videos: ${res.status}`)
  const data = await res.json()
  return data.videos ?? []
}

export function HomeFeed() {
  const { navigate } = useNavigation()
  const { user } = useAuth()
  const [failedAvatarUrls, setFailedAvatarUrls] = useState<Set<string>>(new Set())

  // Shared ['categories'] cache; trending keyed with limit:12 so it doesn't
  // collide with TrendingPage's limit:20 query. "For You" only runs when
  // signed in. The page's loading skeleton tracks the main videos query
  // (as the old code did — only fetchVideos toggled `loading`).
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const { data: trendingVideos = [] } = useQuery({
    queryKey: ['trending', { limit: 12 }],
    queryFn: () => fetchTrending(12),
  })
  const { data: videos = [], isLoading: loading } = useQuery({
    queryKey: ['videos', { page: 1, limit: 24 }],
    queryFn: fetchVideos,
  })
  const { data: forYouVideos = [] } = useQuery({
    queryKey: ['for-you', user?.id],
    queryFn: fetchForYou,
    enabled: !!user,
  })

  // Group videos by category
  const getVideosByCategory = (categorySlug: string) => {
    return videos.filter(v => v.categories?.some(c => c.slug === categorySlug)).slice(0, 8)
  }

  // Feature a small editorial set instead of turning the first trending video
  // into an oversized lone hero. If trending is sparse, fill the set from the
  // latest feed so Featured never becomes an accidental one-card section.
  const featuredVideos = Array.from(
    new Map([...trendingVideos, ...videos].map((video) => [video.id, video])).values(),
  ).slice(0, 4)
  const featuredIds = new Set(featuredVideos.map((video) => video.id))
  const remainingTrendingVideos = trendingVideos.filter((video) => !featuredIds.has(video.id))

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[9/16] rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              <div className="mt-2 h-3.5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="mt-1.5 h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 animate-vert-fade-in">
      {/* For You section — only for logged-in users with watch history */}
      {forYouVideos.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">For You</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {forYouVideos.slice(0, 10).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* Featured — a compact editorial set rather than a lone oversized hero.
          Keeping the cards in the same visual language as the rest of the
          feed makes the section feel intentional at every result count. */}
      {featuredVideos.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {featuredVideos.length > trendingVideos.length ? 'Featured picks' : 'Featured'}
            </h2>
            <button
              onClick={() => navigate({ page: 'trending' })}
              className="text-xs text-violet-600 hover:text-violet-700 font-medium"
            >
              See all
            </button>
          </div>
          <div className={featuredVideos.length === 1
            ? 'grid grid-cols-1 max-w-sm gap-3 md:gap-4'
            : 'grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4'}>
            {featuredVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* Trending — the remaining results, so Featured and Trending do not
          repeat the same cards on the homepage. */}
      {remainingTrendingVideos.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Trending</h2>
            <button
              onClick={() => navigate({ page: 'trending' })}
              className="text-xs text-violet-600 hover:text-violet-700 font-medium"
            >
              See all
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {remainingTrendingVideos.slice(0, 10).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* Category sections — grid, not a shelf */}
      {categories.slice(0, 3).map((cat) => {
        const catVideos = getVideosByCategory(cat.slug)
        if (catVideos.length === 0) return null
        return (
          <section key={cat.id} className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{cat.name}</h2>
              <button
                onClick={() => navigate({ page: 'category', slug: cat.slug })}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium"
              >
                See all
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {catVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        )
      })}

      {/* Latest — grid, not a shelf */}
      {videos.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Latest</h2>
            <button
              onClick={() => navigate({ page: 'explore' })}
              className="text-xs text-violet-600 hover:text-violet-700 font-medium"
            >
              See all
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {videos.slice(0, 15).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* Popular Creators — horizontal row of channel avatars + names.
          Derived from the channels that appear in trending + latest videos.
          Adds social density to the homepage so it doesn't end abruptly
          after the Latest grid. */}
      {(() => {
        const seen = new Set<string>()
        const creators: Array<{ id: string; channelName: string; avatarUrl: string | null }> = []
        for (const v of [...trendingVideos, ...videos]) {
          if (creators.length >= 8) break
          if (seen.has(v.channel.id)) continue
          seen.add(v.channel.id)
          creators.push({
            id: v.channel.id,
            channelName: v.channel.channelName,
            avatarUrl: v.channel.user.avatarUrl,
          })
        }
        if (creators.length === 0) return null
        return (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Popular Creators</h2>
            <div className="flex gap-4 overflow-x-auto shelf-scroll pb-2">
              {creators.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => navigate({ page: 'channel', channelId: ch.id })}
                  className="flex flex-col items-center gap-2 shrink-0 w-20 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 rounded-lg"
                >
                  {ch.avatarUrl && !failedAvatarUrls.has(ch.avatarUrl) ? (
                    isNextImageSafeUrl(ch.avatarUrl) ? (
                      <Image
                        src={ch.avatarUrl}
                        alt={ch.channelName}
                        width={64}
                        height={64}
                        loading="lazy"
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800 group-hover:ring-violet-200 transition-all"
                        onError={() => setFailedAvatarUrls((prev) => new Set(prev).add(ch.avatarUrl!))}
                      />
                    ) : (
                      <img
                        src={ch.avatarUrl}
                        alt={ch.channelName}
                        loading="lazy"
                        decoding="async"
                        onError={() => setFailedAvatarUrls((prev) => new Set(prev).add(ch.avatarUrl!))}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800 group-hover:ring-violet-200 transition-all"
                      />
                    )
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-zinc-100 dark:from-violet-950/40 dark:to-zinc-800 flex items-center justify-center text-violet-600 dark:text-violet-400 text-xl font-bold ring-2 ring-zinc-100 dark:ring-zinc-800 group-hover:ring-violet-200 dark:group-hover:ring-violet-800 transition-all">
                      {ch.channelName[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 text-center line-clamp-1 w-full group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                    {ch.channelName}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )
      })()}

      {/* Empty state */}
      {videos.length === 0 && trendingVideos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <Film className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Nothing here yet</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-xs">
            No videos have been uploaded yet. Be the first to share something!
          </p>
        </div>
      )}
    </div>
  )
}
