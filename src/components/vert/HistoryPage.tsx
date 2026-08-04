'use client'

import Image from 'next/image'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigation, useAuth } from '@/lib/store'
import { VideoCard } from './VideoCard'
import { Button } from '@/components/ui/button'
import { Clock, Trash2, X, Play } from 'lucide-react'
import { timeAgo, formatViews, formatDuration } from '@/lib/utils-vert'

interface HistoryEntry {
  id: string
  watchedAt: string
  progress: number
  video: {
    id: string
    title: string
    thumbnailUrl: string | null
    durationSeconds: number | null
    viewCount: number
    likeCount: number
    createdAt: string
    format?: string
    channel: {
      id: string
      channelName: string
      user: { avatarUrl: string | null }
    }
  }
}

async function fetchHistory(): Promise<HistoryEntry[]> {
  const res = await fetch('/api/v1/history?limit=30')
  if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`)
  const data = await res.json()
  return data.history ?? []
}

export function HistoryPage() {
  const { navigate } = useNavigation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const historyKey = ['history', user?.id] as const

  // enabled:!!user reproduces the old "no user -> not loading, empty list"
  // behavior (the query stays idle, isLoading is false).
  const { data: history = [], isLoading: loading } = useQuery({
    queryKey: historyKey,
    queryFn: fetchHistory,
    enabled: !!user,
  })

  // Deletes are event handlers (not effects), so they stay plain functions —
  // they just write the result straight into the query cache instead of local
  // state, preserving the old optimistic update.
  async function clearAllHistory() {
    try {
      const res = await fetch('/api/v1/history', { method: 'DELETE' })
      if (res.ok) {
        queryClient.setQueryData(historyKey, [])
      }
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  async function removeEntry(videoId: string) {
    try {
      const res = await fetch(`/api/v1/history/${videoId}`, { method: 'DELETE' })
      if (res.ok) {
        queryClient.setQueryData<HistoryEntry[]>(historyKey, (prev) =>
          (prev ?? []).filter((h) => h.video.id !== videoId)
        )
      }
    } catch (error) {
      console.error('Failed to remove history entry:', error)
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Clock className="h-10 w-10 text-zinc-600 dark:text-zinc-400 mb-4" />
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Sign in to see your history</h2>
        <Button
          onClick={() => navigate({ page: 'login' })}
          className="mt-4 bg-violet-600 hover:bg-violet-700 text-white"
        >
          Log In
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-vert-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Watch History</h1>
          </div>
          <p className="text-zinc-700 dark:text-zinc-300 text-sm">Videos you&apos;ve recently watched</p>
        </div>
        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllHistory}
            className="border-zinc-200 dark:border-zinc-700 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-32 sm:w-40 h-[72px] sm:h-[90px] bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">No watch history</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Videos you watch will show up here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 p-2 rounded-lg group hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              onClick={() => navigate({ page: 'video', videoId: entry.video.id })}
            >
              {/* Thumbnail — aspect ratio follows the video's format so
                  portrait videos show as portrait, not squished into 16:9. */}
              <div className="relative w-32 sm:w-40 shrink-0 rounded overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                <div className={`relative ${entry.video.format === 'portrait' ? 'aspect-[9/16]' : entry.video.format === 'square' ? 'aspect-square' : 'aspect-video'}`}>
                  {entry.video.thumbnailUrl ? (
                    <Image src={entry.video.thumbnailUrl} alt={entry.video.title} fill sizes="(max-width: 640px) 128px, 160px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                      <Play className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    </div>
                  )}
                </div>
                {entry.video.durationSeconds && (
                  <div className="absolute bottom-1 right-1 bg-zinc-900/80 text-white text-[10px] font-medium px-1 py-0.5 rounded">
                    {formatDuration(entry.video.durationSeconds)}
                  </div>
                )}
                {/* Watch progress bar */}
                {entry.progress > 0 && entry.progress < 1 && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-700">
                    <div className="h-full bg-violet-600" style={{ width: `${entry.progress * 100}%` }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 py-0.5">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight">{entry.video.title}</p>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1">
                  {entry.video.channel.channelName} · Watched {timeAgo(entry.watchedAt)}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  {formatViews(entry.video.viewCount)} views
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeEntry(entry.video.id)
                }}
                // Always visible on mobile (no hover), hover-revealed on desktop.
                // Larger touch target (p-2) so it's easy to tap on phones.
                className="shrink-0 p-2 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-all"
                aria-label={`Remove ${entry.video.title} from history`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
