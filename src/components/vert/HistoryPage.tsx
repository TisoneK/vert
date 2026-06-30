'use client'

import { useState, useEffect } from 'react'
import { useNavigation, useAuth } from '@/lib/store'
import { VideoCard } from './VideoCard'
import { Button } from '@/components/ui/button'
import { Clock, Trash2, X, Play } from 'lucide-react'
import { timeAgo, formatViews, formatDuration } from '@/lib/utils-vert'
import { CardSkeleton } from './Skeleton'

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
    channel: {
      id: string
      channelName: string
      user: { avatarUrl: string | null }
    }
  }
}

export function HistoryPage() {
  const { navigate } = useNavigation()
  const { user } = useAuth()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchHistory()
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchHistory() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/history?limit=30')
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoading(false)
    }
  }

  async function clearAllHistory() {
    try {
      const res = await fetch('/api/v1/history', { method: 'DELETE' })
      if (res.ok) {
        setHistory([])
      }
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  async function removeEntry(videoId: string) {
    try {
      const res = await fetch(`/api/v1/history/${videoId}`, { method: 'DELETE' })
      if (res.ok) {
        setHistory((prev) => prev.filter((h) => h.video.id !== videoId))
      }
    } catch (error) {
      console.error('Failed to remove history entry:', error)
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Clock className="h-10 w-10 text-zinc-600 mb-4" />
        <h2 className="text-base font-semibold text-zinc-900">Sign in to see your history</h2>
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
            <Clock className="h-5 w-5 text-zinc-600" />
            <h1 className="text-xl font-bold text-zinc-900">Watch History</h1>
          </div>
          <p className="text-zinc-700 text-sm">Videos you&apos;ve recently watched</p>
        </div>
        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllHistory}
            className="border-zinc-200 text-red-600 hover:text-red-700 hover:bg-red-50"
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
              <div className="w-40 h-[90px] bg-zinc-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-zinc-200 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-zinc-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-200 flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-zinc-600" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900">No watch history</h2>
          <p className="text-sm text-zinc-500 mt-1">Videos you watch will show up here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-2 rounded-lg group hover:bg-zinc-50 transition-colors cursor-pointer"
              onClick={() => navigate({ page: 'video', videoId: entry.video.id })}
            >
              {/* Thumbnail */}
              <div className="relative w-40 shrink-0 rounded overflow-hidden bg-zinc-200">
                <div className="aspect-video">
                  {entry.video.thumbnailUrl ? (
                    <img src={entry.video.thumbnailUrl} alt={entry.video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                      <Play className="h-5 w-5 text-zinc-600" />
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
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-200">
                    <div className="h-full bg-violet-600" style={{ width: `${entry.progress * 100}%` }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-tight">{entry.video.title}</p>
                <p className="text-xs text-zinc-700 mt-1">
                  {entry.video.channel.channelName} · Watched {timeAgo(entry.watchedAt)}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">
                  {formatViews(entry.video.viewCount)} views
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeEntry(entry.video.id)
                }}
                className="shrink-0 p-1.5 text-zinc-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
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
