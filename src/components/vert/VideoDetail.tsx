'use client'

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
import { ArrowLeft, Share2, Eye, Bookmark, BookmarkCheck, Copy, Check } from 'lucide-react'
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
      const res = await fetch(`/api/v1/videos/${videoId}`)
      if (res.ok) {
        const data = await res.json()
        setVideo(data)
        const votes = data.votes as { userId: string; voteType: string }[]
        const sessionRes = await fetch('/api/auth/session-info')
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
        <div className="aspect-video bg-zinc-200 rounded-lg animate-pulse" />
        <div className="mt-4 space-y-3">
          <div className="h-6 bg-zinc-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-zinc-200 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-700">Video not found</p>
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
    <div className="max-w-5xl mx-auto p-4 md:p-6 animate-vert-fade-in">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-3 text-xs text-zinc-600">
        <button onClick={() => navigate({ page: 'home' })} className="hover:text-zinc-700 transition-colors">Home</button>
        <span>/</span>
        {categories.length > 0 && (
          <>
            <button
              onClick={() => navigate({ page: 'category', slug: categories[0].slug })}
              className="hover:text-zinc-700 transition-colors"
            >
              {categories[0].name}
            </button>
            <span>/</span>
          </>
        )}
        <span className="text-zinc-600 truncate max-w-[200px]">{video.title as string}</span>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${
        format === 'portrait' ? 'lg:grid-cols-[1fr_300px]' : 'lg:grid-cols-[1fr_320px]'
      }`}>
        {/* Left column: player + info */}
        <div>
          {/* Video player */}
          <VideoPlayer
            videoUrl={video.videoUrl as string}
            thumbnailUrl={video.thumbnailUrl as string | null}
            title={video.title as string}
            format={format}
          />

          {/* Video info */}
          <div className="mt-4">
            <h1 className="text-lg font-bold text-zinc-900">
              {video.title as string}
            </h1>

            {/* Category badges */}
            {categories.length > 0 && (
              <div className="mt-2">
                <CategoryBadge categories={categories} max={5} />
              </div>
            )}

            {/* Tags — clickable chips */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <button
                    key={tag.name}
                    onClick={() => navigate({ page: 'tag', slug: tag.name })}
                    className="px-2 py-1 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-900 rounded-md text-xs font-medium transition-colors"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            )}

            {/* Channel row + actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
              {/* Channel info */}
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate({ page: 'channel', channelId: channel.id })}
                >
                  {channel.user.avatarUrl ? (
                    <img
                      src={channel.user.avatarUrl}
                      alt={channel.channelName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-700 font-bold">
                      {channel.channelName[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold text-zinc-900">{channel.channelName}</p>
                      <svg className="w-3.5 h-3.5 text-violet-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    </div>
                    <p className="text-xs text-zinc-600">{formatSubscribers(channel.subscriberCount)}</p>
                  </div>
                </div>
                <SubscribeButton
                  channelId={channel.id}
                  initialSubscribed={false}
                  subscriberCount={channel.subscriberCount}
                />
              </div>

              {/* Action row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <VoteButtons
                  videoId={video.id as string}
                  likeCount={video.likeCount as number}
                  dislikeCount={video.dislikeCount as number}
                  userVote={userVote}
                />
                <button
                  onClick={toggleSave}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors active:scale-95 duration-100 ${
                    isSaved
                      ? 'bg-zinc-100 text-violet-600'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                  }`}
                >
                  {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  {isSaved ? 'Saved' : 'Save'}
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 text-sm font-medium transition-colors active:scale-95 duration-100"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  {showShareMenu && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-zinc-200 shadow-lg rounded-lg py-1 z-50">
                      <button
                        onClick={() => { handleCopyLink(); setShowShareMenu(false) }}
                        className="w-full text-left px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 flex items-center gap-2 transition-colors"
                      >
                        {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        {copiedLink ? 'Copied!' : 'Copy link'}
                      </button>
                    </div>
                  )}
                </div>
                <FlagDialog videoId={video.id as string} />
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-2 text-xs text-zinc-600 mt-3">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {formatViews(video.viewCount as number)} views
              </span>
              <span>·</span>
              <span>{timeAgo(video.createdAt as string)}</span>
              {format !== 'portrait' && (
                <>
                  <span>·</span>
                  <span className="capitalize text-xs bg-zinc-100 px-2 py-0.5 rounded">{format}</span>
                </>
              )}
            </div>

            {/* Description */}
            {description && (
              <div className="mt-4 p-3 bg-zinc-50 rounded-lg">
                <p className={`text-sm text-zinc-600 whitespace-pre-wrap ${!descriptionExpanded && 'line-clamp-2'}`}>
                  {description}
                </p>
                {description.length > 100 && (
                  <button
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                    className="text-xs text-zinc-600 font-medium mt-1 hover:text-zinc-900 transition-colors"
                  >
                    {descriptionExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}

            {/* Comments */}
            <CommentSection videoId={video.id as string} />
          </div>
        </div>

        {/* Right column: related videos */}
        <div>
          <RelatedVideos videoId={videoId} />
        </div>
      </div>
    </div>
  )
}
