'use client'

import { useNavigation } from '@/lib/store'
import { formatViews, timeAgo, formatDuration } from '@/lib/utils-vert'
import { CategoryBadge } from './CategoryBadge'
import { PlaylistPicker } from './PlaylistPicker'
import { Play, Smartphone, Monitor, Square, MoreVertical, ListVideo } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

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
    tags?: Array<{ name: string; label: string }>
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
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false)
  const [thumbnailFailed, setThumbnailFailed] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const desktopMenuRef = useRef<HTMLDivElement>(null)

  // Close the context menu on outside tap or Escape — important on mobile
  // where the menu is always visible (no hover to toggle it off).
  useEffect(() => {
    if (!showMenu) return
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        mobileMenuRef.current?.contains(target) ||
        desktopMenuRef.current?.contains(target)
      ) {
        return
      }
      setShowMenu(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowMenu(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [showMenu])

  const format = video.format || 'portrait'
  const aspectClass = format === 'landscape' ? 'aspect-video' : format === 'square' ? 'aspect-square' : 'aspect-[9/16]'
  const showThumbnail = video.thumbnailUrl && !thumbnailFailed

  return (
    <div
      // h-full + flex flex-col so cards in the same grid row stretch to equal
      // height regardless of title length. Without this, a card with a 1-line
      // title is shorter than a card with a 2-line title next to it, making
      // the grid look ragged. The thumbnail keeps its aspect ratio; the info
      // section grows to fill the remaining space.
      className="group cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col"
      onClick={() => navigate({ page: 'video', videoId: video.id })}
    >
      {/* Thumbnail container */}
      <div className={`relative ${aspectClass} rounded-lg overflow-hidden bg-zinc-200`}>
        {showThumbnail ? (
          <img
            src={video.thumbnailUrl!}
            alt={video.title}
            onError={() => setThumbnailFailed(true)}
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
          />
        ) : (
          <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
            <Play className="h-8 w-8 text-zinc-500" />
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
          <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-80 transition-opacity duration-200" />
        </div>

        {/* Context menu button — always visible on touch devices (md:hidden),
            hover-reveal on desktop (hidden md:block). The whole card is a
            click target so without this split, mobile users have no way to
            open the menu — tapping the card just navigates to the video. */}
        {showContextMenu && (
          <>
            {/* Mobile: always visible */}
            <div ref={mobileMenuRef} className="md:hidden absolute top-1.5 right-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                className="p-1.5 bg-zinc-900/70 rounded text-white hover:bg-zinc-900/90 transition-colors backdrop-blur-sm"
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-44 bg-white border border-zinc-200 shadow-lg rounded-lg py-1 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { onContextMenuAction?.('save', video.id); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 transition-colors"
                  >
                    Save to Watch Later
                  </button>
                  <button
                    onClick={() => { setShowPlaylistPicker(true); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 transition-colors flex items-center gap-1.5"
                  >
                    <ListVideo className="h-3 w-3" />
                    Add to playlist
                  </button>
                  <button
                    onClick={() => { onContextMenuAction?.('share', video.id); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 transition-colors"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => { onContextMenuAction?.('not-interested', video.id); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 transition-colors"
                  >
                    Not interested
                  </button>
                  <button
                    onClick={() => { onContextMenuAction?.('report', video.id); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Report
                  </button>
                </div>
              )}
            </div>
            {/* Desktop: hover-reveal */}
            <div ref={desktopMenuRef} className="hidden md:block absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                <div
                  className="absolute right-0 top-full mt-1 w-36 bg-white border border-zinc-200 shadow-lg rounded-lg py-1 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { onContextMenuAction?.('save', video.id); setShowMenu(false) }}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 transition-colors"
                  >
                    Save to Watch Later
                  </button>
                  <button
                    onClick={() => { setShowPlaylistPicker(true); setShowMenu(false) }}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 transition-colors flex items-center gap-1.5"
                  >
                    <ListVideo className="h-3 w-3" />
                    Add to playlist
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
          </>
        )}
      </div>

      {/* Video info — flex-1 so it grows to fill the card height
          (the parent is h-full flex flex-col). This keeps cards in the
          same grid row at equal height even when titles have different
          lengths. */}
      <div className="mt-2 flex gap-2 flex-1">
        {/* Channel avatar */}
        <div className="shrink-0 mt-0.5">
          {video.channel.user.avatarUrl && !avatarFailed ? (
            <img
              src={video.channel.user.avatarUrl}
              alt={video.channel.channelName}
              onError={() => setAvatarFailed(true)}
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
          {/* Tags — show up to 3 as clickable chips */}
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {video.tags.slice(0, 3).map((tag) => (
                <button
                  key={tag.name}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate({ page: 'tag', slug: tag.name })
                  }}
                  className="text-[10px] text-violet-600 hover:text-violet-800 hover:underline font-medium transition-colors"
                >
                  {tag.label}
                </button>
              ))}
              {video.tags.length > 3 && (
                <span className="text-[10px] text-zinc-400">+{video.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Playlist picker modal */}
      <PlaylistPicker
        videoId={video.id}
        open={showPlaylistPicker}
        onOpenChange={setShowPlaylistPicker}
      />
    </div>
  )
}
