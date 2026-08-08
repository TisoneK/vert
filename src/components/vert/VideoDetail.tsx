'use client'

import Image from 'next/image'
import { isNextImageSafeUrl } from '@/lib/image-utils'
import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { videoDetailQueryOptions } from '@/lib/video-queries'
import { useNavigation, useAuth } from '@/lib/store'
import { VideoPlayer } from './VideoPlayer'
import { VoteButtons } from './VoteButtons'
import { CommentSection } from './CommentSection'
import { SubscribeButton } from './SubscribeButton'
import { FlagDialog } from './FlagDialog'
import { RelatedVideos } from './RelatedVideos'
import { CategoryBadge } from './CategoryBadge'
import { formatViews, formatSubscribers, timeAgo } from '@/lib/utils-vert'
import { Share2, Bookmark, BookmarkCheck, Copy, Check, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoDetailProps {
  videoId: string
}

async function checkIfSaved(videoId: string): Promise<boolean> {
  const res = await fetch('/api/v1/saved?limit=100')
  if (!res.ok) return false
  const data = await res.json()
  return data.saved.map((s: { videoId: string }) => s.videoId).includes(videoId)
}

async function recordWatchHistory(videoId: string) {
  try {
    await fetch('/api/v1/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, progress: 0 }),
    })
  } catch { /* Silently fail */ }
}

export function VideoDetail({ videoId }: VideoDetailProps) {
  const { navigate } = useNavigation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [failedChannelAvatarUrl, setFailedChannelAvatarUrl] = useState<string | null>(null)
  const [resolvedMedia, setResolvedMedia] = useState<{ videoId: string; sourceUrl: string; ratio: number } | null>(null)

  const { data, isLoading: loading } = useQuery(
    videoDetailQueryOptions(videoId, user?.id ?? 'anonymous'),
  )
  const video = data?.video ?? null
  const userVote = data?.userVote ?? null
  const currentVideoId = video?.id as string | undefined
  const currentVideoUrl = video?.videoUrl as string | undefined
  const handleAspectRatioChange = useCallback((ratio: number) => {
    if (currentVideoId && currentVideoUrl) {
      setResolvedMedia({ videoId: currentVideoId, sourceUrl: currentVideoUrl, ratio })
    }
  }, [currentVideoId, currentVideoUrl])

  const savedKey = ['video-saved', videoId, user?.id] as const
  const { data: isSaved = false } = useQuery({
    queryKey: savedKey,
    queryFn: () => checkIfSaved(videoId),
    enabled: !!user && !!videoId,
  })

  // Record watch history as a fire-and-forget side-effect (no state).
  useEffect(() => {
    if (user && videoId) recordWatchHistory(videoId)
  }, [videoId, user])

  async function toggleSave() {
    if (!user) {
      navigate({ page: 'login' })
      return
    }
    try {
      if (isSaved) {
        await fetch(`/api/v1/videos/${videoId}/save`, { method: 'DELETE' })
      } else {
        await fetch(`/api/v1/videos/${videoId}/save`, { method: 'POST' })
      }
      queryClient.setQueryData(savedKey, !isSaved)
    } catch { /* ignore */ }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto animate-vert-fade-in">
        <div className="aspect-video bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
        <div className="mt-4 space-y-3">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-700 dark:text-zinc-300">Video not found</p>
        <Button
          variant="ghost"
          onClick={() => navigate({ page: 'home' })}
          className="mt-4 text-violet-600"
        >
          Go Home
        </Button>
      </div>
    )
  }

  const channel = video.channel as {
    id: string
    channelName: string
    subscriberCount: number
    isSuspended: boolean
    user: { avatarUrl: string | null; username: string }
    isSubscribed: boolean
  }

  const categories = (video.categories as Array<{ name: string; slug: string }>) || []
  const tags = (video.tags as Array<{ name: string; label: string }>) || []
  const format = (video.format as string) || 'portrait'
  const resolvedAspectRatio = resolvedMedia &&
    resolvedMedia.videoId === currentVideoId &&
    resolvedMedia.sourceUrl === currentVideoUrl
    ? resolvedMedia.ratio
    : null
  const isLandscape = resolvedAspectRatio !== null
    ? resolvedAspectRatio > 1
    : format === 'landscape'
  const description = video.description as string | null

  return (
    <div className="max-w-7xl mx-auto animate-vert-fade-in">
      {/* Desktop watch stage: portrait and square media keep the three-column
          composition, while landscape media gets a wider main column with
          details/comments stacked beneath the player. The 84px desktop
          budget is the 56px header plus the grid's 12px top/bottom padding,
          so the player cannot create a second page scrollbar. Mobile stacks
          normally for every format. */}
      <div className={`grid grid-cols-1 ${isLandscape ? 'lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]' : 'lg:grid-cols-[minmax(250px,0.85fr)_minmax(320px,1.45fr)_minmax(240px,320px)]'} gap-6 p-4 md:p-6 lg:gap-4 lg:p-3 lg:items-start`}>
        {/* Landscape keeps player and details in one wide main column;
            portrait/square expose both as separate desktop grid items. */}
        <div className={`min-w-0 ${isLandscape ? 'lg:flex lg:flex-col lg:gap-6' : 'lg:contents'}`}>
          {/* ============== PLAYER: viewport-fitted on portrait ============== */}
          <div className={`min-w-0 ${isLandscape ? '' : 'lg:sticky lg:top-0 lg:self-start'}`}>
            <div className="w-full flex justify-center lg:justify-start">
              <VideoPlayer
                key={video.id as string}
                videoUrl={video.videoUrl as string}
                thumbnailUrl={video.thumbnailUrl as string | null}
                title={video.title as string}
                format={format}
                videoId={video.id as string}
                onAspectRatioChange={handleAspectRatioChange}
              />
            </div>
          </div>

          {/* ============== DETAILS: profile, details, and comments ============== */}
          <div className="min-w-0">
          {/* ----------------------------------------------------------
              BLOCK 2: TITLE + TAGS (same semantic group — both
              describe what the video is)
              ---------------------------------------------------------- */}
          <div className="mt-3">
            <h1 className="text-base md:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              {video.title as string}
            </h1>
            {/* Tags sit directly under the title as chips — they're part of
                the "what is this video" semantic group, not floating alone. */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <button
                    key={tag.name}
                    onClick={() => navigate({ page: 'tag', slug: tag.name })}
                    className="px-2 py-0.5 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:text-violet-900 dark:hover:text-violet-300 rounded-md text-xs font-medium transition-colors"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ----------------------------------------------------------
              BLOCK 3: STATS (views/time) — quiet supporting metadata,
              smaller and muted so it doesn't compete with the title.
              ---------------------------------------------------------- */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
            <span>{formatViews(video.viewCount as number)} views</span>
            <span>·</span>
            <span>{timeAgo(video.createdAt as string)}</span>
          </div>

          {/* ----------------------------------------------------------
              BLOCKS 4 + 5: CHANNEL IDENTITY + ACTIONS
              Single divided row with top+bottom borders so it reads as a
              distinct section rather than bleeding into the title above
              and description below. Channel (who) on the left, actions
              (what I can do) on the right.
              ---------------------------------------------------------- */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-2 mt-4 py-3 border-y border-zinc-200 dark:border-zinc-700">
            {/* Channel + subscribe */}
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="flex items-center gap-2 cursor-pointer min-w-0"
                onClick={() => navigate({ page: 'channel', channelId: channel.id })}
              >
                {channel.user.avatarUrl && failedChannelAvatarUrl !== channel.user.avatarUrl ? (
                  isNextImageSafeUrl(channel.user.avatarUrl) ? (
                    <Image
                      src={channel.user.avatarUrl}
                      alt={channel.channelName}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                      onError={() => setFailedChannelAvatarUrl(channel.user.avatarUrl)}
                    />
                  ) : (
                    <img
                      src={channel.user.avatarUrl}
                      alt={channel.channelName}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                      onError={() => setFailedChannelAvatarUrl(channel.user.avatarUrl)}
                    />
                  )
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 text-xs font-bold shrink-0">
                    {channel.channelName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[8rem] sm:max-w-[12rem]">{channel.channelName}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{formatSubscribers(channel.subscriberCount)}</p>
                </div>
              </div>
              <SubscribeButton
                key={`${channel.id}-${user?.id ?? 'anonymous'}-${channel.isSubscribed}`}
                channelId={channel.id}
                initialSubscribed={channel.isSubscribed}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <VoteButtons
                videoId={video.id as string}
                likeCount={video.likeCount as number}
                userVote={userVote}
              />
              <button
                onClick={toggleSave}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors active:scale-95 duration-100 shrink-0 ${
                  isSaved
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-violet-600'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
                aria-label={isSaved ? 'Remove from saved' : 'Save for later'}
                title={isSaved ? 'Remove from saved' : 'Save for later'}
              >
                {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              </button>
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium transition-colors active:scale-95 duration-100"
                  aria-label="Share"
                  title="Share"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg rounded-lg py-1 z-50">
                    <button
                      onClick={() => { handleCopyLink(); setShowShareMenu(false) }}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedLink ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>
                )}
              </div>
              <FlagDialog videoId={video.id as string} />
            </div>
          </div>

          {/* ----------------------------------------------------------
              BLOCK 6: DESCRIPTION — its own contained card with a real
              expand affordance (chevron icon + label) instead of a
              dangling "..." truncation. Categories live here too since
              they're part of the "about this video" semantic group.
              ---------------------------------------------------------- */}
          {(description || categories.length > 0) && (
            <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-700">
              {description && (
                <>
                  <p className={`text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap ${!descriptionExpanded && description.length > 100 ? 'line-clamp-2' : ''}`}>
                    {description}
                  </p>
                  {description.length > 100 && (
                    <button
                      onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                      className="flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mt-2 transition-colors"
                    >
                      {descriptionExpanded ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" />
                          Show more
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
              {categories.length > 0 && (
                <div className={description ? 'mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700' : ''}>
                  <CategoryBadge categories={categories} max={5} />
                </div>
              )}
            </div>
          )}

          <section className="hidden lg:block mt-6" aria-labelledby="watch-comments-heading">
            <h2 id="watch-comments-heading" className="sr-only">Comments</h2>
            <CommentSection videoId={video.id as string} />
          </section>
          </div>
        </div>

        {/* ============== RIGHT COLUMN: fixed ad + scrolling Up Next ============== */}
        <aside
          className="hidden lg:flex lg:sticky lg:top-0 lg:h-[calc(100dvh-84px)] lg:max-h-[calc(100dvh-84px)] lg:min-h-0 lg:flex-col lg:gap-5"
          aria-label="Up next and advertisement"
        >
          {/* Keep the ad outside the scrolling region, so it remains visible
              while the recommendation list moves independently below it. */}
          <div className="shrink-0">
            <AdSlot headingId="watch-ad-heading-desktop" />
          </div>
          <section
            aria-labelledby="watch-up-next-heading"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain custom-scrollbar pr-2"
          >
            <h2 id="watch-up-next-heading" className="sr-only">Up next</h2>
            <RelatedVideos videoId={videoId} compact />
          </section>
        </aside>
      </div>

      {/* Mobile/tablet sidebar content follows the details without sticky or
          nested desktop rail behavior. */}
      <div className="lg:hidden px-4 md:px-6 pb-6 space-y-6">
        <CommentSection videoId={video.id as string} />
        <AdSlot headingId="watch-ad-heading-mobile" />
        <RelatedVideos videoId={videoId} />
      </div>
    </div>
  )
}

function AdSlot({ headingId }: { headingId: string }) {
  return (
    <section
      aria-labelledby={headingId}
      className="min-h-24 rounded-xl border border-dashed border-zinc-300 bg-zinc-100/70 px-4 py-5 text-center dark:border-zinc-700 dark:bg-zinc-900/70"
    >
      <h2 id={headingId} className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
        Advertisement
      </h2>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Sponsored content will appear here
      </p>
    </section>
  )
}
