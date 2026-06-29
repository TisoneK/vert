'use client'

import { useState, useEffect } from 'react'
import { useNavigation, useAuth } from '@/lib/store'
import { VideoCard } from './VideoCard'
import { Button } from '@/components/ui/button'
import { Bookmark, X } from 'lucide-react'
import { CardSkeleton } from './Skeleton'

interface SavedEntry {
  userId: string
  videoId: string
  createdAt: string
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

export function SavedPage() {
  const { navigate } = useNavigation()
  const { user } = useAuth()
  const [saved, setSaved] = useState<SavedEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchSaved()
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchSaved() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/saved?limit=30')
      if (res.ok) {
        const data = await res.json()
        setSaved(data.saved)
      }
    } catch (error) {
      console.error('Failed to fetch saved:', error)
    } finally {
      setLoading(false)
    }
  }

  async function unsaveVideo(videoId: string) {
    try {
      const res = await fetch(`/api/v1/videos/${videoId}/save`, { method: 'DELETE' })
      if (res.ok) {
        setSaved((prev) => prev.filter((s) => s.videoId !== videoId))
      }
    } catch (error) {
      console.error('Failed to unsave video:', error)
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Bookmark className="h-10 w-10 text-zinc-600 mb-4" />
        <h2 className="text-base font-semibold text-zinc-900">Sign in to see your saved videos</h2>
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
    <div className="p-4 md:p-6 animate-vert-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Bookmark className="h-5 w-5 text-zinc-600" />
          <h1 className="text-xl font-bold text-zinc-900">Watch Later</h1>
        </div>
        <p className="text-zinc-700 text-sm">Videos you&apos;ve saved for later</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : saved.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-200 flex items-center justify-center mb-4">
            <Bookmark className="h-6 w-6 text-zinc-600" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900">Nothing saved yet</h2>
          <p className="text-sm text-zinc-700 mt-1">Save videos to watch them later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {saved.map((entry) => (
            <div key={entry.videoId} className="relative group">
              <VideoCard video={entry.video} />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  unsaveVideo(entry.videoId)
                }}
                className="absolute top-1.5 right-1.5 p-1.5 bg-white/80 text-zinc-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-red-500 shadow-sm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
