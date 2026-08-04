'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@/lib/store'
import { VideoCard } from './VideoCard'
import { CardSkeleton } from './Skeleton'
import { Search, SlidersHorizontal, Users, Film, Smartphone, Monitor, Square } from 'lucide-react'
import { formatViews, formatSubscribers } from '@/lib/utils-vert'

interface SearchResultsProps {
  query: string
}

interface VideoResult {
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
}

interface ChannelResult {
  id: string
  channelName: string
  description: string | null
  subscriberCount: number
  videoCount: number
  bannerUrl: string | null
  user: { avatarUrl: string | null; username: string }
}

type ResultTab = 'videos' | 'channels'
type SortOption = 'relevance' | 'date' | 'views'
type FormatFilter = '' | 'portrait' | 'landscape' | 'square'
type DateFilter = '' | 'today' | 'week' | 'month' | 'year'

async function fetchVideos(
  q: string,
  sortBy: SortOption,
  formatFilter: FormatFilter,
  dateFilter: DateFilter,
): Promise<VideoResult[]> {
  const params = new URLSearchParams({
    search: q,
    limit: '20',
    sort: sortBy === 'relevance' ? 'latest' : sortBy,
  })
  if (formatFilter) params.set('format', formatFilter)
  if (dateFilter) params.set('date', dateFilter)
  const res = await fetch(`/api/v1/videos?${params}`)
  if (!res.ok) throw new Error(`Search failed: ${res.status}`)
  const data = await res.json()
  return data.videos ?? []
}

async function fetchChannels(q: string): Promise<ChannelResult[]> {
  const res = await fetch(`/api/v1/channels/search?q=${encodeURIComponent(q)}&limit=20`)
  if (!res.ok) throw new Error(`Channel search failed: ${res.status}`)
  const data = await res.json()
  return data.channels ?? []
}

export function SearchResults({ query }: SearchResultsProps) {
  const { navigate } = useNavigation()
  const [searchQuery, setSearchQuery] = useState(query)
  const [prevQuery, setPrevQuery] = useState(query)
  const [tab, setTab] = useState<ResultTab>('videos')
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('')

  // Keep the search box in sync with the URL prop without an effect —
  // React's "adjust state while rendering" pattern for a prop-derived value.
  if (query !== prevQuery) {
    setPrevQuery(query)
    setSearchQuery(query)
  }

  // One query per tab; only the active tab (with a non-empty query) fetches.
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['search-videos', query, sortBy, formatFilter, dateFilter],
    queryFn: () => fetchVideos(query, sortBy, formatFilter, dateFilter),
    enabled: !!query && tab === 'videos',
  })
  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ['search-channels', query],
    queryFn: () => fetchChannels(query),
    enabled: !!query && tab === 'channels',
  })
  const loading = tab === 'videos' ? videosLoading : channelsLoading

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate({ page: 'search', query: searchQuery.trim() })
    }
  }

  const sortFilters: Array<{ label: string; value: SortOption }> = [
    { label: 'Relevance', value: 'relevance' },
    { label: 'Date', value: 'date' },
    { label: 'Views', value: 'views' },
  ]

  const formatFilters: Array<{ label: string; value: FormatFilter; icon: React.ElementType }> = [
    { label: 'All', value: '', icon: Film },
    { label: 'Portrait', value: 'portrait', icon: Smartphone },
    { label: 'Landscape', value: 'landscape', icon: Monitor },
    { label: 'Square', value: 'square', icon: Square },
  ]

  const dateFilters: Array<{ label: string; value: DateFilter }> = [
    { label: 'Any time', value: '' },
    { label: 'Today', value: 'today' },
    { label: 'This week', value: 'week' },
    { label: 'This month', value: 'month' },
    { label: 'This year', value: 'year' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-vert-fade-in">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos, channels…"
            className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-base md:text-sm text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-600 transition-colors"
          />
        </div>
      </form>

      {query && (
        <>
          {/* Header + result tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Results for &ldquo;{query}&rdquo;
            </h1>
            <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700 -mb-px">
              <button
                onClick={() => setTab('videos')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === 'videos'
                    ? 'border-violet-600 text-zinc-900 dark:text-zinc-100'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Film className="h-3.5 w-3.5" />
                Videos
              </button>
              <button
                onClick={() => setTab('channels')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === 'channels'
                    ? 'border-violet-600 text-zinc-900 dark:text-zinc-100'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Channels
              </button>
            </div>
          </div>

          {/* Filters — only show on Videos tab.
              On mobile, the sort + format + date controls are split into
              two rows: sort+format on the first row (scrollable horizontally
              so they don't wrap awkwardly), date on the second. On desktop
              everything stays on one line. */}
          {tab === 'videos' && (
            <div className="mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 overflow-x-auto shelf-scroll scroll-fade">
                {/* Sort */}
                <div className="flex items-center gap-1 shrink-0">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 mr-1" />
                  {sortFilters.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setSortBy(f.value)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors shrink-0 ${
                        sortBy === f.value
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Format filter */}
                <div className="flex items-center gap-1 shrink-0">
                  {formatFilters.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFormatFilter(f.value)}
                      title={f.label}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors shrink-0 ${
                        formatFilter === f.value
                          ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <f.icon className="h-3 w-3" />
                      <span className="hidden sm:inline">{f.label}</span>
                    </button>
                  ))}
                </div>

                {/* Date filter — pushed to the right on desktop,
                    inline on mobile. */}
                <div className="flex items-center gap-1 sm:ml-auto shrink-0">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                    className="text-xs bg-transparent text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-600"
                    aria-label="Upload date"
                  >
                    {dateFilters.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Results */}
      {loading ? (
        tab === 'videos' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
            ))}
          </div>
        )
      ) : tab === 'videos' ? (
        videos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : query ? (
          <EmptyState query={query} type="videos" />
        ) : (
          <TypeSomethingState />
        )
      ) : (
        // Channels tab
        channels.length > 0 ? (
          <div className="space-y-3">
            {channels.map((ch) => (
              <div
                key={ch.id}
                onClick={() => navigate({ page: 'channel', channelId: ch.id })}
                className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                {/* Avatar */}
                <div className="shrink-0">
                  {ch.user.avatarUrl ? (
                    <img src={ch.user.avatarUrl} alt={ch.channelName} loading="lazy" decoding="async" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400 text-lg font-bold">
                      {ch.channelName[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{ch.channelName}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    @{ch.user.username} · {formatSubscribers(ch.subscriberCount)} · {ch.videoCount} videos
                  </p>
                  {ch.description && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-1">{ch.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : query ? (
          <EmptyState query={query} type="channels" />
        ) : (
          <TypeSomethingState />
        )
      )}
    </div>
  )
}

function EmptyState({ query, type }: { query: string; type: 'videos' | 'channels' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-4">
        <Search className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
      </div>
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        No {type} found
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
        Try different keywords or adjust your filters.
      </p>
    </div>
  )
}

function TypeSomethingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Search className="h-10 w-10 text-zinc-600 dark:text-zinc-400 mb-4" />
      <p className="text-zinc-600 dark:text-zinc-400 text-sm">Type something to search</p>
    </div>
  )
}
