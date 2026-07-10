'use client'

import { fetchWithRetry } from '@/lib/fetch-retry'
import { useState, useEffect } from 'react'
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

export function VideoDetail({ videoId }: VideoDetailProps) {
  const { navigate } = useNavigation()
  const { user } = useAuth()
  const [video, setVideo] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [userVote, setUserVote] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    fetchVideo()
  }, [videoId])

  useEffect(() => {
    if (user && videoId) {
      recordWatchHistory()
      checkIfSaved()
    }
  }, [videoId, user])

  async function recordWatchHistory() {
    try {
      await fetch('/api/v1/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, progress: 0 }),
      })
    } catch { /* Silently fail */ }
  }

  async function checkIfSaved() {
    try {
      const res = await fetch('/api/v1/saved?limit=100')
      if (res.ok) {
        const data = await res.json()
        const savedVideoIds = data.saved.map((s: { videoId: string }) => s.videoId)
        setIsSaved(savedVideoIds.includes(videoId))
      }
    } catch { /* ignore */ }
  }

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
      setIsSaved(!isSaved)
    } catch { /* ignore */ }
  }

  async function fetchVideo() {
    setLoading(true)
    try {
      const res = await fetchWithRetry(`/api/v1/videos/${videoId}`)
      if (res.ok) {
        const data = await res.json()
        setVideo(data)
        const votes = data.votes as { userId: string; voteType: string }[]
        const sessionRes = await fetchWithRetry('/api/auth/session-info')
        const sessionData = await sessionRes.json()
        if (sessionData.user) {
          const userVoteRecord = votes?.find((v) => v.userId === sessionData.user.id)
          setUserVote(userVoteRecord?.voteType || null)
        }
      }
    } catch (error) {
      console.error('Failed to fetch video:', error)
    } finally {
      setLoading(false)
    }
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
  }

  const categories = (video.categories as Array<{ name: string; slug: string }>) || []
  const tags = (video.tags as Array<{ name: string; label: string }>) || []
  const format = (video.format as string) || 'portrait'
  const description = video.description as string | null

  return (
    <div className="max-w-5xl mx-auto animate-vert-fade-in">
      {/* ============================================================
          BLOCK 1: VIDEO
          On mobile: full screen width (like Shorts/Reels).
          On desktop: portrait videos are constrained to ~380px so they
          don't get absurdly tall. The freed-up right space is used for
          the "Up Next" queue instead of being empty canvas.
          ============================================================ */}
      <div className="w-full flex justify-center">
        <VideoPlayer
          videoUrl={video.videoUrl as string}
          thumbnailUrl={video.thumbnailUrl as string | null}
          title={video.title as string}
          format={format}
          videoId={video.id as string}
        />
      </div>

      {/* Two-column on desktop: video info (left) + Up Next queue (right).
          On mobile/tablet the queue collapses below everything. */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 p-4 md:p-6">
        {/* ============== LEFT COLUMN: video info + comments ============== */}
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
                {channel.user.avatarUrl ? (
                  <img
                    src={channel.user.avatarUrl}
                    alt={channel.channelName}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
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
                channelId={channel.id}
                initialSubscribed={false}
                subscriberCount={channel.subscriberCount}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <VoteButtons
                videoId={video.id as string}
                likeCount={video.likeCount as number}
                dislikeCount={video.dislikeCount as number}
                userVote={userVote}
              />
              <button
                onClick={toggleSave}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                  isSaved
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-violet-600'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
                aria-label={isSaved ? 'Remove from saved' : 'Save for later'}
              >
                {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              </button>
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium transition-colors"
                  aria-label="Share"
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

          {/* Comments */}
          <CommentSection videoId={video.id as string} />

          {/* Related videos — below comments on mobile/tablet */}
          <div className="lg:hidden mt-6">
            <RelatedVideos videoId={videoId} />
          </div>
        </div>

        {/* ============== RIGHT COLUMN: Up Next queue (desktop) ============== */}
        <div className="hidden lg:block">
          <RelatedVideos videoId={videoId} />
        </div>
      </div>
    </div>
  )
}
