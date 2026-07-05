'use client'
import { fetchWithRetry } from '@/lib/fetch-retry'

import { useState, useEffect } from 'react'
import { useNavigation, useAuth } from '@/lib/store'
import { VideoCard } from './VideoCard'
import { ShelfSkeleton } from './Skeleton'
import { formatViews } from '@/lib/utils-vert'
import { Play, Film, Sparkles } from 'lucide-react'

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

  useEffect(() => {
    fetchCategories()
    fetchTrending()
    fetchVideos()
    if (user) fetchForYou()
  }, [user])

  async function fetchCategories() {
    try {
      const res = await fetchWithRetry('/api/v1/categories')
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
      const res = await fetch('/api/v1/trending?limit=12')
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
      const res = await fetch('/api/v1/videos?page=1&limit=24')
      const data = await res.json()
      setVideos(data.videos)
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group videos by category
  const getVideosByCategory = (categorySlug: string) => {
    return videos.filter(v => v.categories?.some(c => c.slug === categorySlug)).slice(0, 8)
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video rounded-lg bg-zinc-200" />
              <div className="mt-2 h-3.5 w-3/4 rounded bg-zinc-200" />
              <div className="mt-1.5 h-3 w-1/2 rounded bg-zinc-200" />
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
            <h2 className="text-sm font-semibold text-zinc-900">For You</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {forYouVideos.slice(0, 10).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* Featured — one hero video, not a shelf */}
      {trendingVideos.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Featured</h2>
          <div
            className="relative aspect-video rounded-lg overflow-hidden bg-zinc-200 cursor-pointer group"
            onClick={() => navigate({ page: 'video', videoId: trendingVideos[0].id })}
          >
            {trendingVideos[0].thumbnailUrl ? (
              <img
                src={trendingVideos[0].thumbnailUrl}
                alt={trendingVideos[0].title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                <Play className="h-10 w-10 text-zinc-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <span className="inline-block px-2 py-0.5 bg-violet-600 text-white rounded text-[10px] font-bold uppercase mb-2">Featured</span>
              <h3 className="text-lg font-bold text-white line-clamp-1">{trendingVideos[0].title}</h3>
              <p className="text-sm text-zinc-300 mt-0.5">
                {trendingVideos[0].channel.channelName} · {formatViews(trendingVideos[0].viewCount)} views
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Trending — grid, not a shelf */}
      {trendingVideos.length > 1 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900">Trending</h2>
            <button
              onClick={() => navigate({ page: 'trending' })}
              className="text-xs text-violet-600 hover:text-violet-700 font-medium"
            >
              See all
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {trendingVideos.slice(1, 11).map((video) => (
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
              <h2 className="text-sm font-semibold text-zinc-900">{cat.name}</h2>
              <button
                onClick={() => navigate({ page: 'category', slug: cat.slug })}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium"
              >
                See all
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
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
            <h2 className="text-sm font-semibold text-zinc-900">Latest</h2>
            <button
              onClick={() => navigate({ page: 'explore' })}
              className="text-xs text-violet-600 hover:text-violet-700 font-medium"
            >
              See all
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {videos.slice(0, 15).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {videos.length === 0 && trendingVideos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
            <Film className="h-7 w-7 text-zinc-400" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900">Nothing here yet</h2>
          <p className="text-sm text-zinc-500 mt-1.5 max-w-xs">
            No videos have been uploaded yet. Be the first to share something!
          </p>
        </div>
      )}
    </div>
  )
}
