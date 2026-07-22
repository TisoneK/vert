'use client'

import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
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

interface TagVideosPage {
  tag: TagInfo
  videos: Video[]
  pagination: { totalPages: number }
}

async function fetchTagVideos(slug: string, sort: string, pageNum: number): Promise<TagVideosPage> {
  const params = new URLSearchParams({ page: pageNum.toString(), limit: '12', sort })
  const res = await fetch(`/api/v1/tags/${encodeURIComponent(slug)}/videos?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch tag videos: ${res.status}`)
  return res.json()
}

export function TagPage({ slug }: { slug: string }) {
  const { navigate } = useNavigation()
  const [sort, setSort] = useState<'latest' | 'trending' | 'popular'>('latest')

  const {
    data,
    isLoading: loading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['tag-videos', slug, sort],
    queryFn: ({ pageParam }) => fetchTagVideos(slug, sort, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      allPages.length < lastPage.pagination.totalPages ? allPages.length + 1 : undefined,
  })

  const videos = data?.pages.flatMap((p) => p.videos ?? []) ?? []
  // On a 404 the queryFn throws -> data is undefined -> tag null -> the
  // "Tag not found" header shows (same as the old code's 404 branch).
  const tag = data?.pages[0]?.tag ?? null

  const handleSortChange = (newSort: 'latest' | 'trending' | 'popular') => {
    setSort(newSort)
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-vert-fade-in">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate({ page: 'explore' })}
        className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 transition-colors mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Explore
      </button>

      {/* Tag header */}
      {tag ? (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Hash className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{tag.label}</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {tag.usageCount} {tag.usageCount === 1 ? 'video' : 'videos'}
              </p>
            </div>
          </div>
        </div>
      ) : !loading ? (
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
              <Hash className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">#{slug}</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Tag not found</p>
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
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Videos grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">No videos with this tag yet.</p>
        </div>
      )}

      {!loading && hasNextPage && videos.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
            className="border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  )
}
