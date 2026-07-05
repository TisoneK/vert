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
        setCategories(data.categories)
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
        setVideos(data.videos)
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
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Trending</h1>
        </div>
        <p className="text-zinc-500 text-sm ml-10">What&apos;s hot right now on Vert</p>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 shelf-scroll">
        <button
          onClick={() => handleCategoryFilter(null)}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 ${
            !activeCategory
              ? 'bg-zinc-900 text-white'
              : 'bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => handleCategoryFilter(cat.slug)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 ${
              activeCategory === cat.slug
                ? 'bg-zinc-900 text-white'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-200 flex items-center justify-center mb-4">
            <Flame className="h-6 w-6 text-zinc-600" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900">No trending videos</h2>
          <p className="text-sm text-zinc-700 mt-1">Check back later for trending content</p>
        </div>
      ) : (
        <>
          {/* Hero section with top trending video */}
          {heroVideo && (
            <div
              className="relative mb-8 rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-200 ring-1 ring-zinc-200/60"
              onClick={() => navigate({ page: 'video', videoId: heroVideo.id })}
            >
              <div className="aspect-video bg-zinc-200">
                {heroVideo.thumbnailUrl ? (
                  <img src={heroVideo.thumbnailUrl} alt={heroVideo.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md">
                      <Play className="h-7 w-7 text-zinc-700 fill-zinc-700 ml-0.5" />
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500 text-white rounded-full text-[11px] font-bold uppercase tracking-wide">
                      <Flame className="h-3 w-3" />
                      #1 Trending
                    </span>
                    {heroVideo.categories?.slice(0, 2).map((cat) => (
                      <span
                        key={cat.slug}
                        className="px-2 py-0.5 bg-white/15 backdrop-blur-sm text-white rounded-full text-[11px] font-medium border border-white/10"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-lg md:text-2xl font-bold text-white mb-2 leading-tight line-clamp-2">
                    {heroVideo.title}
                  </h2>
                  <p className="text-zinc-200 text-sm">
                    {heroVideo.channel.channelName} · {formatViews(heroVideo.viewCount)} views
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trending grid */}
          {gridVideos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {gridVideos.map((video, index) => (
                <div key={video.id} className="relative">
                  <VideoCard video={video} />
                  <div className="absolute top-2 left-2 bg-zinc-900/85 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
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
