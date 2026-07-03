'use client'

import { useState, useEffect } from 'react'
import { useNavigation } from '@/lib/store'
import { VideoCard } from './VideoCard'
import { ArrowLeft, Hash } from 'lucide-react'
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
  tags: Array<{ name: string; label: string }>
}

interface TagInfo {
  id: string
  name: string
  label: string
  usageCount: number
}

export function TagPage({ slug }: { slug: string }) {
  const { navigate } = useNavigation()
  const [videos, setVideos] = useState<Video[]>([])
  const [tag, setTag] = useState<TagInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'latest' | 'trending' | 'popular'>('latest')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    setPage(1)
    fetchTagVideos(1, true)
  }, [slug, sort])

  async function fetchTagVideos(pageNum: number, reset = false) {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '12',
        sort,
      })
      const res = await fetch(`/api/v1/tags/${encodeURIComponent(slug)}/videos?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTag(data.tag)
        if (reset) {
          setVideos(data.videos)
        } else {
          setVideos((prev) => [...prev, ...data.videos])
        }
        setHasMore(pageNum < data.pagination.totalPages)
      } else if (res.status === 404) {
        setTag(null)
        setVideos([])
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to fetch tag videos:', error)
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
    fetchTagVideos(nextPage)
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-vert-fade-in">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate({ page: 'explore' })}
        className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-700 transition-colors mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Explore
      </button>

      {/* Tag header */}
      {tag ? (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Hash className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">{tag.label}</h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                {tag.usageCount} {tag.usageCount === 1 ? 'video' : 'videos'}
              </p>
            </div>
          </div>
        </div>
      ) : !loading ? (
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-200 flex items-center justify-center">
              <Hash className="h-5 w-5 text-zinc-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">#{slug}</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Tag not found</p>
            </div>
          </div>
        </div>
      ) : null}

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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-zinc-500">No videos with this tag yet.</p>
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
