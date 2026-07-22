'use client'

import { fetchWithRetry } from '@/lib/fetch-retry'
import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
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

interface CategoryVideosPage {
  category: CategoryInfo
  videos: Video[]
  pagination: { totalPages: number }
}

async function fetchCategoryVideos(
  slug: string,
  sort: string,
  pageNum: number,
): Promise<CategoryVideosPage> {
  const params = new URLSearchParams({ page: pageNum.toString(), limit: '12', sort })
  const res = await fetchWithRetry(`/api/v1/categories/${slug}/videos?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch category videos: ${res.status}`)
  return res.json()
}

export function CategoryPage({ slug }: { slug: string }) {
  const { navigate } = useNavigation()
  const [sort, setSort] = useState<'latest' | 'trending' | 'popular'>('latest')

  // Paginated feed -> useInfiniteQuery. Changing slug/sort is a query-key
  // change (fresh page 1); "Load More" is fetchNextPage. Unlike the old code,
  // fetching the next page no longer blanks the grid with skeletons — the
  // existing videos stay while the button shows a loading state.
  const {
    data,
    isLoading: loading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['category-videos', slug, sort],
    queryFn: ({ pageParam }) => fetchCategoryVideos(slug, sort, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      allPages.length < lastPage.pagination.totalPages ? allPages.length + 1 : undefined,
  })

  const videos = data?.pages.flatMap((p) => p.videos ?? []) ?? []
  const category = data?.pages[0]?.category ?? null

  const handleSortChange = (newSort: 'latest' | 'trending' | 'popular') => {
    setSort(newSort)
  }

  const Icon = category ? (categoryIconMap[category.slug] || Film) : Film

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

      {/* Category header */}
      {category && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
              <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{category.name}</h1>
          </div>
          {category.description && (
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">{category.description}</p>
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
          <p className="text-zinc-500 dark:text-zinc-400">No videos in this category yet — be the first to add one.</p>
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
