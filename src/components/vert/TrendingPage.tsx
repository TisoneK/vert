'use client'

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
      const res = await fetch('/api/v1/categories')
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
      const res = await fetch(`/api/v1/trending?${params}`)
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
    <div className="p-4 md:p-6 animate-vert-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="h-5 w-5 text-orange-500" />
          <h1 className="text-xl font-bold text-zinc-900">Trending</h1>
        </div>
        <p className="text-zinc-700 text-sm">What&apos;s hot right now on Vert</p>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 shelf-scroll">
        <button
          onClick={() => handleCategoryFilter(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !activeCategory
              ? 'bg-zinc-100 text-zinc-900'
              : 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => handleCategoryFilter(cat.slug)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat.slug
                ? 'bg-zinc-100 text-zinc-900'
                : 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              className="relative mb-8 rounded-lg overflow-hidden cursor-pointer group shadow-sm hover:shadow-lg transition-all duration-200"
              onClick={() => navigate({ page: 'video', videoId: heroVideo.id })}
            >
              <div className="aspect-video bg-zinc-200">
                {heroVideo.thumbnailUrl ? (
                  <img src={heroVideo.thumbnailUrl} alt={heroVideo.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                    <Play className="h-12 w-12 text-zinc-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-zinc-900/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-orange-500/90 text-white rounded text-[10px] font-bold uppercase">
                      #1 Trending
                    </span>
                    {heroVideo.categories?.slice(0, 2).map((cat) => (
                      <span
                        key={cat.slug}
                        className="px-2 py-0.5 bg-white/10 text-zinc-300 rounded text-xs"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-lg md:text-2xl font-bold text-white mb-2">
                    {heroVideo.title}
                  </h2>
                  <p className="text-zinc-300 text-sm">
                    {heroVideo.channel.channelName} · {formatViews(heroVideo.viewCount)} views
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trending grid */}
          {gridVideos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gridVideos.map((video, index) => (
                <div key={video.id} className="relative">
                  <VideoCard video={video} />
                  <div className="absolute top-1.5 left-1.5 bg-zinc-900/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
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
