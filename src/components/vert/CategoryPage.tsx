'use client'

import { fetchWithRetry } from '@/lib/fetch-retry'
import { useState, useEffect } from 'react'
import { useNavigation } from '@/lib/store'
import { VideoCard } from './VideoCard'
import { ArrowLeft, Film, Music, Trophy, Gamepad2, Newspaper, Monitor, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  channel: {
    id: string
    channelName: string
    user: { avatarUrl: string | null }
  }
  categories: Array<{ name: string; slug: string }>
}

interface CategoryInfo {
  id: string
  name: string
  slug: string
  description: string | null
}

const categoryIconMap: Record<string, React.ElementType> = {
  music: Music,
  sports: Trophy,
  gaming: Gamepad2,
  entertainment: Film,
  news: Newspaper,
  education: Monitor,
  comedy: Film,
  tech: Cpu,
  travel: Film,
  food: Film,
  fitness: Trophy,
  art: Film,
  other: Film,
}

export function CategoryPage({ slug }: { slug: string }) {
  const { navigate } = useNavigation()
  const [videos, setVideos] = useState<Video[]>([])
  const [category, setCategory] = useState<CategoryInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'latest' | 'trending' | 'popular'>('latest')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    setPage(1)
    fetchCategoryVideos(1, true)
  }, [slug, sort])

  async function fetchCategoryVideos(pageNum: number, reset = false) {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '12',
        sort,
      })
      const res = await fetchWithRetry(`/api/v1/categories/${slug}/videos?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCategory(data.category)
        if (reset) {
          setVideos(data.videos)
        } else {
          setVideos((prev) => [...prev, ...data.videos])
        }
        setHasMore(pageNum < data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch category videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSortChange = (newSort: 'latest' | 'trending' | 'popular') => {
    setSort(newSort)
    setPage(1)
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchCategoryVideos(nextPage)
  }

  const Icon = category ? (categoryIconMap[category.slug] || Film) : Film

  return (
    <div className="p-4 md:p-6 animate-vert-fade-in">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate({ page: 'explore' })}
        className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-700 transition-colors mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Explore
      </button>

      {/* Category header */}
      {category && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-zinc-200 flex items-center justify-center">
              <Icon className="h-5 w-5 text-zinc-600" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900">{category.name}</h1>
          </div>
          {category.description && (
            <p className="text-zinc-600 text-sm">{category.description}</p>
          )}
        </div>
      )}

      {/* Sort tabs */}
      <div className="flex gap-2 mb-6">
        {(['latest', 'trending', 'popular'] as const).map((s) => (
          <button
            key={s}
            onClick={() => handleSortChange(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors active:scale-95 duration-100 ${
              sort === s
                ? 'bg-zinc-100 text-zinc-900'
                : 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Videos grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-zinc-700">No videos in this category yet</p>
        </div>
      )}

      {!loading && hasMore && videos.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={loadMore}
            variant="outline"
            className="border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}
