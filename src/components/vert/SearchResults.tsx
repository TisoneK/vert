'use client'

import { useState, useEffect } from 'react'
import { useNavigation } from '@/lib/store'
import { VideoCard } from './VideoCard'
import { CardSkeleton } from './Skeleton'
import { Button } from '@/components/ui/button'
import { Search, SlidersHorizontal } from 'lucide-react'
import { formatViews, timeAgo } from '@/lib/utils-vert'

interface SearchResultsProps {
  query: string
}

export function SearchResults({ query }: SearchResultsProps) {
  const { navigate } = useNavigation()
  const [videos, setVideos] = useState<Array<{
    id: string
    title: string
    thumbnailUrl: string | null
    durationSeconds: number | null
    viewCount: number
    likeCount: number
    createdAt: string
    format?: string
    channel: { id: string; channelName: string; user: { avatarUrl: string | null } }
    categories?: Array<{ name: string; slug: string }>
  }>>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState(query)
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'views'>('relevance')

  useEffect(() => {
    if (searchQuery) {
      fetchResults(searchQuery)
    }
  }, [])

  useEffect(() => {
    if (query) {
      fetchResults(query)
    }
  }, [sortBy])

  async function fetchResults(q: string) {
    if (!q) return
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/videos?search=${encodeURIComponent(q)}&limit=20&sort=${sortBy}`)
      const data = await res.json()
      setVideos(data.videos)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      fetchResults(searchQuery.trim())
    }
  }

  const sortFilters = [
    { label: 'Relevance', value: 'relevance' as const },
    { label: 'Date', value: 'date' as const },
    { label: 'Views', value: 'views' as const },
  ]

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-vert-fade-in">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-100 rounded-full text-sm text-zinc-600 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-violet-600 transition-colors"
          />
        </div>
      </form>

      {query && (
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-zinc-900">
            Results for &ldquo;{query}&rdquo;
          </h1>
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-600 mr-1" />
            {sortFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setSortBy(f.value)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  sortBy === f.value
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : query ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 rounded-full bg-zinc-200 flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-zinc-600" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900">No results found</h2>
          <p className="text-sm text-zinc-700 mt-1">Try searching for something else</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <Search className="h-10 w-10 text-zinc-600 mb-4" />
          <p className="text-zinc-600 text-sm">Type something to search</p>
        </div>
      )}
    </div>
  )
}
