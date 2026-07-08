'use client'

import { fetchWithRetry } from '@/lib/fetch-retry'
import { useState, useEffect } from 'react'
import { useNavigation } from '@/lib/store'
import { VideoCard } from './VideoCard'
import { Flame, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatViews, timeAgo } from '@/lib/utils-vert'
import { CardSkeleton } from './Skeleton'

interface Video {
  id: string
  title: string
  thumbnailUrl: string | null
  durationSeconds: number | null
  viewCount: number
  likeCount: number
  createdAt: string
  format: string
  trendingScore?: number
  channel: {
    id: string
    channelName: string
    user: { avatarUrl: string | null }
  }
  categories: Array<{ name: string; slug: string }>
}

interface Category {
  id: string
  name: string
  slug: string
  videoCount: number
}

export function TrendingPage() {
  const { navigate } = useNavigation()
  const [videos, setVideos] = useState<Video[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
    fetchTrending()
  }, [])

  async function fetchCategories() {
    try {
      const res = await fetchWithRetry('/api/v1/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories ?? [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  async function fetchTrending(category?: string) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '20' })
      if (category) params.set('category', category)
      const res = await fetchWithRetry(`/api/v1/trending?${params}`)
      if (res.ok) {
        const data = await res.json()
        setVideos(data.videos ?? [])
      }
    } catch (error) {
      console.error('Failed to fetch trending:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryFilter = (slug: string | null) => {
    setActiveCategory(slug)
    fetchTrending(slug || undefined)
  }

  const heroVideo = videos[0]
  const gridVideos = videos.slice(1)

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-vert-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="h-5 w-5 text-orange-500" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Trending</h1>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">What&apos;s hot right now on Vert</p>
      </div>

      {/* Category filter tabs — horizontally scrollable on mobile with
          a fade hint on the right edge so users know there's more to scroll. */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 shelf-scroll scroll-fade">
        <button
          onClick={() => handleCategoryFilter(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 ${
            !activeCategory
              ? 'bg-violet-600 text-white'
              : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => handleCategoryFilter(cat.slug)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 ${
              activeCategory === cat.slug
                ? 'bg-violet-600 text-white'
                : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <Flame className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">No trending videos</h2>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">Check back later for trending content</p>
        </div>
      ) : (
        <>
          {/* Hero section with top trending video. Aspect ratio matches the
              video's actual format (same logic as HomeFeed's Featured and
              VideoCard) — hardcoding aspect-video cropped portrait videos.
              Height cap is taller on mobile (60vh) so the hero doesn't look
              shrunked, and 42vh on desktop so the grid peeks below the fold. */}
          {heroVideo && (() => {
            const heroAspect =
              heroVideo.format === 'landscape' ? 'aspect-video' :
              heroVideo.format === 'square' ? 'aspect-square' :
              'aspect-[9/16]'
            const heroSizing = heroVideo.format === 'landscape'
              ? 'w-full max-h-[60vh] md:max-h-[42vh]'
              : 'h-[60vh] md:h-[42vh] mx-auto'
            return (
            <div
              className="relative mb-8 rounded-lg overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-all duration-200"
              onClick={() => navigate({ page: 'video', videoId: heroVideo.id })}
            >
              <div className={`${heroAspect} ${heroSizing} bg-zinc-200 dark:bg-zinc-800`}>
                {heroVideo.thumbnailUrl ? (
                  <img src={heroVideo.thumbnailUrl} alt={heroVideo.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                    <Play className="h-10 w-10 text-zinc-500 dark:text-zinc-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-1.5 py-0.5 bg-orange-500/90 backdrop-blur-sm text-white rounded text-[9px] font-bold uppercase tracking-wider">
                      #1 Trending
                    </span>
                    {heroVideo.categories?.slice(0, 2).map((cat) => (
                      <span
                        key={cat.slug}
                        className="px-2 py-0.5 bg-white/15 backdrop-blur-sm text-white rounded-full text-[11px] font-medium"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-white mb-1 leading-tight line-clamp-2 drop-shadow-sm">
                    {heroVideo.title}
                  </h2>
                  <p className="text-zinc-200 text-sm drop-shadow-sm">
                    {heroVideo.channel.channelName} · {formatViews(heroVideo.viewCount)} views
                  </p>
                </div>
              </div>
            </div>
            )
          })()}

          {/* Trending grid */}
          {gridVideos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {gridVideos.map((video, index) => (
                <div key={video.id} className="relative">
                  <VideoCard video={video} />
                  {/* Ranking badge — bottom-LEFT of the thumbnail. Avoids
                      overlap with:
                        - VideoCard's FormatIcon (top-left when not portrait)
                        - VideoCard's context menu (top-right, hover-revealed)
                        - VideoCard's duration badge (bottom-right)
                        - VideoCard's watch-progress bar (very bottom edge)
                      pointer-events-none so taps go through to the card. */}
                  <div className="absolute bottom-2 left-2 z-20 bg-zinc-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none">
                    #{index + 2}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
