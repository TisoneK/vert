'use client'

import { useState, useEffect } from 'react'
import { useNavigation } from '@/lib/store'
import { formatViews, timeAgo, formatDuration } from '@/lib/utils-vert'
import { Play } from 'lucide-react'
import { RelatedVideoSkeleton } from './Skeleton'

interface RelatedVideo {
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

interface RelatedVideosProps {
  videoId: string
}

export function RelatedVideos({ videoId }: RelatedVideosProps) {
  const { navigate } = useNavigation()
  const [videos, setVideos] = useState<RelatedVideo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRelated()
  }, [videoId])

  async function fetchRelated() {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/videos/${videoId}/related?limit=10`)
      if (res.ok) {
        const data = await res.json()
        setVideos(data.videos)
      }
    } catch (error) {
      console.error('Failed to fetch related videos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <p className="text-sm font-medium text-zinc-600 mb-3">Up Next</p>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <RelatedVideoSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div>
        <p className="text-sm font-medium text-zinc-600 mb-3">Up Next</p>
        <p className="text-xs text-zinc-400">No more videos yet.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm font-medium text-zinc-600 mb-3">Up Next</p>
      <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-1">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className="flex gap-2 cursor-pointer group p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
            onClick={() => navigate({ page: 'video', videoId: video.id })}
          >
            {/* Thumbnail - horizontal layout */}
            <div className="relative w-32 shrink-0 rounded overflow-hidden bg-zinc-200">
              <div className="aspect-video">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                    <Play className="h-5 w-5 text-zinc-600" />
                  </div>
                )}
              </div>
              {video.durationSeconds && (
                <div className="absolute bottom-1 right-1 bg-zinc-900/80 text-white text-[10px] font-medium px-1 py-0.5 rounded">
                  {formatDuration(video.durationSeconds)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 py-0.5">
              <h4 className="text-xs font-semibold text-zinc-900 line-clamp-2 leading-tight group-hover:text-violet-600 transition-colors">
                {video.title}
              </h4>
              <p className="text-[11px] text-zinc-600 mt-1">
                {video.channel.channelName}
              </p>
              <p className="text-[11px] text-zinc-600">
                {formatViews(video.viewCount)} views · {timeAgo(video.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
