'use client'

import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { relatedVideosQueryOptions } from '@/lib/video-queries'
import { usePrefetchVideo } from '@/lib/use-prefetch-video'
import { useNavigation } from '@/lib/store'
import { formatViews, timeAgo, formatDuration } from '@/lib/utils-vert'
import { Play } from 'lucide-react'
import { RelatedVideoSkeleton } from './Skeleton'

interface RelatedVideosProps {
  videoId: string
  compact?: boolean
}

export function RelatedVideos({ videoId, compact = false }: RelatedVideosProps) {
  const { navigate } = useNavigation()
  const prefetchVideo = usePrefetchVideo()
  // Keyed on videoId so navigating between videos refetches the right list.
  const { data: videos = [], isLoading: loading } = useQuery(relatedVideosQueryOptions(videoId))

  if (loading) {
    return (
      <div>
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">Up Next</p>
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
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">Up Next</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">No more videos yet.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">Up Next</p>
      <div className={compact ? 'space-y-2 pr-1' : 'space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-1'}>
        {videos.map((video) => (
          <div
            key={video.id}
            className="flex gap-2 cursor-pointer group p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => navigate({ page: 'video', videoId: video.id })}
            onMouseEnter={() => prefetchVideo(video.id)}
            onTouchStart={() => prefetchVideo(video.id)}
          >
            {/* Desktop's compact rail uses a dense 16:9 preview so more
                recommendations remain scannable above the fold. The normal
                mobile/tablet list keeps the video's real format. */}
            <div className="relative w-32 shrink-0 rounded overflow-hidden bg-zinc-200 dark:bg-zinc-800">
              <div className={`relative ${compact ? 'aspect-video' : video.format === 'portrait' ? 'aspect-[9/16]' : video.format === 'square' ? 'aspect-square' : 'aspect-video'}`}>
                {video.thumbnailUrl ? (
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    sizes="128px"
                    className="object-cover transition-transform group-hover:scale-105 duration-200"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                    <Play className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
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
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight group-hover:text-violet-600 transition-colors">
                {video.title}
              </h4>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                {video.channel.channelName}
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                {formatViews(video.viewCount)} views · {timeAgo(video.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
