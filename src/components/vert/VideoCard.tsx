'use client'

import { useNavigation } from '@/lib/store'
import { formatViews, timeAgo, formatDuration } from '@/lib/utils-vert'
import { CategoryBadge } from './CategoryBadge'
import { Play, Smartphone, Monitor, Square, MoreVertical } from 'lucide-react'
import { useState } from 'react'

interface VideoCardProps {
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
      user: {
        avatarUrl: string | null
      }
    }
    categories?: Array<{ name: string; slug: string }>
  }
  watchProgress?: number
  showContextMenu?: boolean
  onContextMenuAction?: (action: string, videoId: string) => void
}

function FormatIcon({ format }: { format: string }) {
  if (format === 'landscape') {
    return (
      <div className="flex items-center gap-0.5 bg-zinc-200/80 text-zinc-600 px-1 py-0.5 rounded" title="Landscape">
        <Monitor className="h-2.5 w-2.5" />
      </div>
    )
  }
  if (format === 'square') {
    return (
      <div className="flex items-center gap-0.5 bg-zinc-200/80 text-zinc-600 px-1 py-0.5 rounded" title="Square">
        <Square className="h-2.5 w-2.5" />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-0.5 bg-zinc-200/80 text-zinc-600 px-1 py-0.5 rounded" title="Portrait">
      <Smartphone className="h-2.5 w-2.5" />
    </div>
  )
}

export function VideoCard({ video, watchProgress, showContextMenu = true, onContextMenuAction }: VideoCardProps) {
  const { navigate } = useNavigation()
  const [showMenu, setShowMenu] = useState(false)

  const format = video.format || 'portrait'
  const aspectClass = format === 'landscape' ? 'aspect-video' : format === 'square' ? 'aspect-square' : 'aspect-[9/16]'

  return (
    <div
      className="group cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      onClick={() => navigate({ page: 'video', videoId: video.id })}
    >
      {/* Thumbnail container */}
      <div className={`relative ${aspectClass} rounded-lg overflow-hidden bg-zinc-200`}>
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
          />
        ) : (
          <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
            <Play className="h-10 w-10 text-zinc-600" />
          </div>
        )}

        {/* Duration badge */}
        {video.durationSeconds && (
          <div className="absolute bottom-1.5 right-1.5 bg-zinc-900/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
            {formatDuration(video.durationSeconds)}
          </div>
        )}

        {/* Format indicator */}
        {format !== 'portrait' && (
          <div className="absolute top-1.5 left-1.5">
            <FormatIcon format={format} />
          </div>
        )}

        {/* Watch progress bar */}
        {watchProgress !== undefined && watchProgress > 0 && watchProgress < 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-200">
            <div
              className="h-full bg-violet-600"
              style={{ width: `${watchProgress * 100}%` }}
            />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
          <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-70 transition-opacity duration-200" />
        </div>

        {/* Context menu button */}
        {showContextMenu && (
          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1 bg-zinc-900/70 rounded text-white hover:bg-zinc-900/90 transition-colors"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-zinc-200 shadow-lg rounded-lg py-1 z-50" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { onContextMenuAction?.('save', video.id); setShowMenu(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Save to Watch Later
                </button>
                <button
                  onClick={() => { onContextMenuAction?.('share', video.id); setShowMenu(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Share
                </button>
                <button
                  onClick={() => { onContextMenuAction?.('not-interested', video.id); setShowMenu(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Not interested
                </button>
                <button
                  onClick={() => { onContextMenuAction?.('report', video.id); setShowMenu(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-zinc-100 transition-colors"
                >
                  Report
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video info */}
      <div className="mt-2 flex gap-2">
        {/* Channel avatar */}
        <div className="shrink-0 mt-0.5">
          {video.channel.user.avatarUrl ? (
            <img
              src={video.channel.user.avatarUrl}
              alt={video.channel.channelName}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-700 text-[10px] font-bold">
              {video.channel.channelName[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-tight">
            {video.title}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate({ page: 'channel', channelId: video.channel.id })
            }}
            className="text-xs text-zinc-600 hover:text-zinc-800 transition-colors mt-0.5 block"
          >
            {video.channel.channelName}
          </button>
          <p className="text-xs text-zinc-600 mt-0.5">
            {formatViews(video.viewCount)} views · {timeAgo(video.createdAt)}
          </p>
          {video.categories && video.categories.length > 0 && (
            <CategoryBadge categories={video.categories} max={2} />
          )}
        </div>
      </div>
    </div>
  )
}
