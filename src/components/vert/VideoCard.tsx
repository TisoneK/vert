'use client'

import Image from 'next/image'
import { useNavigation, viewToPath } from '@/lib/store'
import { usePrefetchVideo } from '@/lib/use-prefetch-video'
import { formatViews, formatDuration } from '@/lib/utils-vert'
import { PlaylistPicker } from './PlaylistPicker'
import { ThumbnailFallback } from './ThumbnailFallback'
import { Play, Smartphone, Monitor, Square, MoreVertical, ListVideo, Bookmark } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'

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
      <div className="flex items-center gap-0.5 bg-zinc-200/80 dark:bg-zinc-700/80 text-zinc-600 dark:text-zinc-300 px-1 py-0.5 rounded" title="Landscape">
        <Monitor className="h-2.5 w-2.5" />
      </div>
    )
  }
  if (format === 'square') {
    return (
      <div className="flex items-center gap-0.5 bg-zinc-200/80 dark:bg-zinc-700/80 text-zinc-600 dark:text-zinc-300 px-1 py-0.5 rounded" title="Square">
        <Square className="h-2.5 w-2.5" />
      </div>
    )
  }
  return (
      <div className="flex items-center gap-0.5 bg-zinc-200/80 dark:bg-zinc-700/80 text-zinc-600 dark:text-zinc-300 px-1 py-0.5 rounded" title="Portrait">
      <Smartphone className="h-2.5 w-2.5" />
    </div>
  )
}

export function VideoCard({ video, watchProgress, showContextMenu = true, onContextMenuAction }: VideoCardProps) {
  const { navigate } = useNavigation()
  const prefetchVideo = usePrefetchVideo()
  const [showMenu, setShowMenu] = useState(false)
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false)
  const [thumbnailFailed, setThumbnailFailed] = useState(false)
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false)
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
  const watchHref = viewToPath({ page: 'video', videoId: video.id })

  // The card's primary target is a real <a href> (the stretched link below),
  // so it's crawlable, keyboard-focusable, and supports open-in-new-tab /
  // copy-link. For a plain left-click we preventDefault and drive the Zustand
  // SPA navigation; modified clicks (⌘/ctrl/shift/middle) fall through to the
  // browser's native new-tab/window behavior. See .context ADR-26.
  const handleNav = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    navigate({ page: 'video', videoId: video.id })
  }

  // Cached images can already be `complete` before React attaches `onLoad`,
  // which would leave the thumbnail stuck at opacity-0. Catch that on mount.
  const thumbRef = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth > 0) setThumbnailLoaded(true)
  }, [])

  return (
    <div
      // h-full + flex flex-col so cards in the same grid row stretch to equal
      // height regardless of title length. Without this, a card with a 1-line
      // title is shorter than a card with a 2-line title next to it, making
      // the grid look ragged. The thumbnail keeps its aspect ratio; the info
      // section grows to fill the remaining space.
      // `relative` anchors the stretched-link overlay (the title <a>'s
      // ::after) to the whole card; nested controls sit above it with z-index.
      // Landscape cards span the full row on phones (col-span-2 in the
      // 2-column mobile grids) — at half width a 16:9 thumbnail is too small
      // to read, the original complaint behind v0.6.4's full-width cards.
      // Portrait/square cards stay 2-up for browse density. md:col-span-1
      // restores normal flow in the 4/5-column desktop grids.
      className={`group relative rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 ${format === 'landscape' ? 'col-span-2 md:col-span-1' : ''}`}
      // Pre-fetch the watch page's data on hover/touch intent so the click
      // renders from cache instead of a loading skeleton. See .context ADR-3.
      onMouseEnter={() => prefetchVideo(video.id)}
      onTouchStart={() => prefetchVideo(video.id)}
    >
      {/* Thumbnail container */}
      <div className={`relative ${aspectClass} rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800`}>
        {showThumbnail ? (
          <>
            {/* Gradient-poster underlay: sits behind the always-visible image
                until the image paints over it, so the card shows an intentional
                branded poster while the real thumbnail loads (never a flat gray
                box — review [P1]) and never gets stuck invisible if the image's
                load event doesn't fire. Cached images mark loaded on mount
                (thumbRef), so they skip even this one frame. */}
            {!thumbnailLoaded && <ThumbnailFallback seed={video.title} loading />}
            <Image
              ref={thumbRef}
              src={video.thumbnailUrl!}
              alt={video.title}
              fill
              // Cards render 2-up on phones, 3-up on tablet, 4–5-up on desktop —
              // tell the optimizer so it serves a right-sized AVIF/WebP, not the
              // full-resolution source. See .context ADR-5.
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
              onError={() => setThumbnailFailed(true)}
              onLoad={() => setThumbnailLoaded(true)}
              className="object-cover transition-transform group-hover:scale-105 duration-200"
            />
          </>
        ) : (
          <ThumbnailFallback seed={video.title} />
        )}

        {/* Whole-card link to the video. Metadata is overlaid on the
            thumbnail (vertical-video style), so the click target is the
            thumbnail itself; secondary actions (channel, context menu) sit
            above this with a higher z-index. See .context ADR-26. */}
        <a
          href={watchHref}
          onClick={handleNav}
          onFocus={() => prefetchVideo(video.id)}
          aria-label={video.title}
          className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400"
        />

        {/* Format indicator */}
        {format !== 'portrait' && (
          <div className="absolute top-1.5 left-1.5 z-20">
            <FormatIcon format={format} />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 z-20 pointer-events-none bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
          <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-80 transition-opacity duration-200 drop-shadow" />
        </div>

        {/* Watch progress bar — above the scrim so it stays visible */}
        {watchProgress !== undefined && watchProgress > 0 && watchProgress < 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/25 z-30">
            <div
              className="h-full bg-violet-500"
              style={{ width: `${watchProgress * 100}%` }}
            />
          </div>
        )}

        {/* Context menu button — always visible on touch devices (md:hidden),
            hover-reveal on desktop (hidden md:block). The whole card is a
            click target so without this split, mobile users have no way to
            open the menu — tapping the card just navigates to the video. */}
        {showContextMenu && (
          <>
            {/* Mobile: always visible. Bookmark is the single highest-value
                action (matches Dailymotion's exposed Like/Bookmark/Share
                row) surfaced directly so it doesn't require opening a menu;
                everything else (playlist, share, not interested, report)
                stays in the overflow since the card is too narrow in a
                dense grid for a full 3-button row. */}
            <div ref={mobileMenuRef} className="md:hidden absolute top-1.5 right-1.5 z-20 flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onContextMenuAction?.('save', video.id)
                }}
                className="p-1.5 bg-zinc-900/70 rounded text-white hover:bg-zinc-900/90 transition-colors backdrop-blur-sm"
                aria-label="Save to Watch Later"
              >
                <Bookmark className="h-4 w-4" />
              </button>
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
                  className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg rounded-lg py-1 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { setShowPlaylistPicker(true); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                  >
                    <ListVideo className="h-3 w-3" />
                    Add to playlist
                  </button>
                  <button
                    onClick={() => { onContextMenuAction?.('share', video.id); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => { onContextMenuAction?.('not-interested', video.id); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Not interested
                  </button>
                  <button
                    onClick={() => { onContextMenuAction?.('report', video.id); setShowMenu(false) }}
                    className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Report
                  </button>
                </div>
              )}
            </div>
            {/* Desktop: hover-reveal */}
            <div ref={desktopMenuRef} className="hidden md:flex items-center gap-1 absolute top-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onContextMenuAction?.('save', video.id)
                }}
                className="p-1 bg-zinc-900/70 rounded text-white hover:bg-zinc-900/90 transition-colors"
                aria-label="Save to Watch Later"
              >
                <Bookmark className="h-3.5 w-3.5" />
              </button>
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
                  className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg rounded-lg py-1 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { setShowPlaylistPicker(true); setShowMenu(false) }}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                  >
                    <ListVideo className="h-3 w-3" />
                    Add to playlist
                  </button>
                  <button
                    onClick={() => { onContextMenuAction?.('share', video.id); setShowMenu(false) }}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => { onContextMenuAction?.('not-interested', video.id); setShowMenu(false) }}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Not interested
                  </button>
                  <button
                    onClick={() => { onContextMenuAction?.('report', video.id); setShowMenu(false) }}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Report
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Metadata overlay (vertical-video style): title + channel · views
            over a bottom scrim. The container is pointer-events-none so taps
            fall through to the whole-card link; the channel button re-enables
            pointer events to navigate to the channel instead. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-2.5 pt-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
          <h3 className="text-[13px] font-semibold text-white line-clamp-2 leading-snug drop-shadow-sm">
            {video.title}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/85">
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate({ page: 'channel', channelId: video.channel.id })
              }}
              className="pointer-events-auto truncate hover:text-white transition-colors"
            >
              {video.channel.channelName}
            </button>
            <span className="text-white/50">·</span>
            <span className="whitespace-nowrap">{formatViews(video.viewCount)} views</span>
            {video.durationSeconds && (
              <span className="ml-auto whitespace-nowrap text-white/75">{formatDuration(video.durationSeconds)}</span>
            )}
          </div>
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
