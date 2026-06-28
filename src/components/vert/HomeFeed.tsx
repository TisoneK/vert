'use client'

import { useState, useEffect } from 'react'
import { useNavigation, useAuth } from '@/lib/store'
import { VideoCard } from './VideoCard'
import { VideoShelf } from './VideoShelf'
import { ShelfSkeleton } from './Skeleton'
import { formatViews, timeAgo } from '@/lib/utils-vert'
import { Button } from '@/components/ui/button'
import { Play, Flame, Clock, Sparkles, Film } from 'lucide-react'
import { Smartphone, Monitor, Square } from 'lucide-react'

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

export function HomeFeed() {
  const { navigate } = useNavigation()
  const { user } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [trendingVideos, setTrendingVideos] = useState<Video[]>([])
  const [forYouVideos, setForYouVideos] = useState<Video[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFormat, setActiveFormat] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
    fetchTrending()
    fetchVideos()
    if (user) fetchForYou()
  }, [user])

  useEffect(() => {
    fetchVideos()
  }, [activeFormat])

  async function fetchCategories() {
    try {
      const res = await fetch('/api/v1/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  async function fetchTrending() {
    try {
      const res = await fetch('/api/v1/trending?limit=10')
      if (res.ok) {
        const data = await res.json()
        setTrendingVideos(data.videos)
      }
    } catch (error) {
      console.error('Failed to fetch trending:', error)
    }
  }

  async function fetchForYou() {
    try {
      const res = await fetch('/api/v1/feed/for-you?limit=12', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        // Only show the shelf if the response is actually personalized —
        // if the user has no watch history, the API returns trending and we
        // don't want a duplicate shelf next to the Featured one.
        if (data.personalized) {
          setForYouVideos(data.videos)
        } else {
          setForYouVideos([])
        }
      }
    } catch (error) {
      console.error('Failed to fetch for-you:', error)
    }
  }

  async function fetchVideos() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: '1', limit: '20' })
      if (activeFormat) params.set('format', activeFormat)
      const res = await fetch(`/api/v1/videos?${params}`)
      const data = await res.json()
      setVideos(data.videos)
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group videos by category for shelves
  const getVideosByCategory = (categorySlug: string) => {
    return videos.filter(v => v.categories?.some(c => c.slug === categorySlug)).slice(0, 8)
  }

  // Format filter chips
  const formatFilters = [
    { label: 'All Formats', value: null, icon: Film },
    { label: 'Portrait', value: 'portrait', icon: Smartphone },
    { label: 'Landscape', value: 'landscape', icon: Monitor },
    { label: 'Square', value: 'square', icon: Square },
  ]

  return (
    <div className="p-4 md:p-6 animate-vert-fade-in">
      {/* Format filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 shelf-scroll">
        {formatFilters.map((fmt) => (
          <button
            key={fmt.label}
            onClick={() => setActiveFormat(fmt.value)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors active:scale-95 transition-transform duration-100 ${
              activeFormat === fmt.value
                ? 'bg-zinc-100 text-zinc-900 border border-zinc-300'
                : 'bg-white text-zinc-600 hover:text-zinc-800 border border-transparent hover:border-zinc-200'
            }`}
          >
            <fmt.icon className="h-3.5 w-3.5" />
            {fmt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <>
          <ShelfSkeleton />
          <ShelfSkeleton />
          <ShelfSkeleton />
        </>
      ) : (
        <>
          {/* "For You" shelf — only for logged-in users with watch history.
              The fetchForYou() helper gates on data.personalized so we don't
              show a duplicate trending shelf. */}
          {forYouVideos.length > 0 && !activeFormat && (
            <VideoShelf
              title="For You"
              icon={<Sparkles className="h-4 w-4 text-violet-600" />}
              onSeeAll={() => navigate({ page: 'explore' })}
            >
              {forYouVideos.map((video) => (
                <div key={video.id} className="shrink-0 w-[200px]">
                  <VideoCard video={video} />
                </div>
              ))}
            </VideoShelf>
          )}

          {/* Featured shelf with hero card */}
          {trendingVideos.length > 0 && !activeFormat && (
            <VideoShelf
              title="Featured"
              onSeeAll={() => navigate({ page: 'trending' })}
            >
              {/* Hero card - spans 2 cols on lg+ */}
              <div
                className="shrink-0 w-[200px] lg:w-[460px] cursor-pointer group shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                onClick={() => navigate({ page: 'video', videoId: trendingVideos[0].id })}
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-200">
                  {trendingVideos[0].thumbnailUrl ? (
                    <img
                      src={trendingVideos[0].thumbnailUrl}
                      alt={trendingVideos[0].title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                      <Play className="h-12 w-12 text-zinc-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-1.5 py-0.5 bg-orange-500/90 text-white rounded text-[10px] font-bold uppercase">Featured</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white line-clamp-2">{trendingVideos[0].title}</h3>
                    <p className="text-xs text-zinc-300 mt-1">
                      {trendingVideos[0].channel.channelName} · {formatViews(trendingVideos[0].viewCount)} views
                    </p>
                  </div>
                </div>
              </div>
              {/* Regular cards alongside */}
              {trendingVideos.slice(1, 6).map((video) => (
                <div key={video.id} className="shrink-0 w-[200px]">
                  <VideoCard video={video} />
                </div>
              ))}
            </VideoShelf>
          )}

          {/* Trending shelf */}
          {trendingVideos.length > 0 && !activeFormat && (
            <VideoShelf
              title="Trending Now"
              onSeeAll={() => navigate({ page: 'trending' })}
            >
              {trendingVideos.map((video) => (
                <div key={video.id} className="shrink-0 w-[200px]">
                  <VideoCard video={video} />
                </div>
              ))}
            </VideoShelf>
          )}

          {/* Category shelves */}
          {categories.slice(0, 4).map((cat) => {
            const catVideos = getVideosByCategory(cat.slug)
            if (catVideos.length === 0) return null
            return (
              <VideoShelf
                key={cat.id}
                title={cat.name}
                onSeeAll={() => navigate({ page: 'category', slug: cat.slug })}
              >
                {catVideos.map((video) => (
                  <div key={video.id} className="shrink-0 w-[200px]">
                    <VideoCard video={video} />
                  </div>
                ))}
              </VideoShelf>
            )
          })}

          {/* Latest Videos shelf */}
          {videos.length > 0 && (
            <VideoShelf
              title={activeFormat ? `${activeFormat} Videos` : 'Latest Videos'}
              onSeeAll={() => navigate({ page: 'explore' })}
            >
              {videos.map((video) => (
                <div key={video.id} className="shrink-0 w-[200px]">
                  <VideoCard video={video} />
                </div>
              ))}
            </VideoShelf>
          )}

          {/* Empty state */}
          {!loading && videos.length === 0 && trendingVideos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-zinc-200 flex items-center justify-center mb-4">
                <Film className="h-6 w-6 text-zinc-600" />
              </div>
              <h2 className="text-base font-semibold text-zinc-900">No videos found</h2>
              <p className="text-sm text-zinc-700 mt-1">Try adjusting your filters</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
