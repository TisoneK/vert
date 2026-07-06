'use client'

import { useState, useEffect } from 'react'
import { useNavigation } from '@/lib/store'
import { VideoCard } from './VideoCard'
import { SubscribeButton } from './SubscribeButton'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatViews, formatSubscribers } from '@/lib/utils-vert'
import { CardSkeleton } from './Skeleton'

interface ChannelPageProps {
  channelId: string
}

export function ChannelPage({ channelId }: ChannelPageProps) {
  const { navigate } = useNavigation()
  const [channelData, setChannelData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChannel()
  }, [channelId])

  async function fetchChannel() {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/channels/${channelId}`)
      if (res.ok) {
        const data = await res.json()
        setChannelData(data)
      }
    } catch (error) {
      console.error('Failed to fetch channel:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-24 md:h-36 bg-zinc-200 animate-pulse" />
        <div className="px-4 md:px-6 py-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-full bg-zinc-200 animate-pulse" />
            <div className="space-y-2 pt-4">
              <div className="h-5 bg-zinc-200 rounded w-32 animate-pulse" />
              <div className="h-3 bg-zinc-200 rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!channelData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-700">Channel not found</p>
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

  const channel = channelData.channel as {
    id: string
    channelName: string
    description: string | null
    bannerUrl: string | null
    subscriberCount: number
    videoCount: number
    isSuspended: boolean
    createdAt: string
    user: { id: string; username: string; avatarUrl: string | null }
  }

  const videos = (channelData.videos as Array<{
    id: string
    title: string
    thumbnailUrl: string | null
    durationSeconds: number | null
    viewCount: number
    likeCount: number
    createdAt: string
    channel: { id: string; channelName: string; user: { avatarUrl: string | null } }
  }>) || []

  return (
    <div className="max-w-5xl mx-auto animate-vert-fade-in">
      {/* Banner */}
      <div className="h-24 md:h-36 relative overflow-hidden">
        {channel.bannerUrl ? (
          <img
            src={channel.bannerUrl}
            alt={channel.channelName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-100 via-violet-50 to-zinc-100" />
        )}
        <button
          onClick={() => navigate({ page: 'home' })}
          className="absolute top-3 left-3 flex items-center gap-1.5 text-xs font-medium text-zinc-700 bg-white/80 backdrop-blur-sm px-2.5 py-1.5 rounded-full hover:bg-white hover:text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to feed
        </button>
      </div>

      {/* Channel info */}
      <div className="px-4 md:px-6 py-4">
        {/* Avatar + info + Subscribe — stack vertically on mobile so the
            Subscribe button doesn't push the channel name off-screen on a
            360px viewport. On md+ they sit side-by-side as before. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="shrink-0 -mt-8 self-start">
            {channel.user.avatarUrl ? (
              <img
                src={channel.user.avatarUrl}
                alt={channel.channelName}
                className="w-20 h-20 rounded-full object-cover border-4 border-white"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-700 text-2xl font-bold border-4 border-white">
                {channel.channelName[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 sm:pt-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl md:text-2xl font-bold text-zinc-900 truncate">
                {channel.channelName}
              </h1>
              <svg className="w-4 h-4 text-violet-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </div>
            <p className="text-zinc-600 text-sm mt-0.5">
              @{channel.user.username} · {channel.videoCount} videos · {formatSubscribers(channel.subscriberCount)}
            </p>
          </div>
          <div className="shrink-0 self-start">
            <SubscribeButton
              channelId={channel.id}
              initialSubscribed={false}
              subscriberCount={channel.subscriberCount}
            />
          </div>
        </div>

        {channel.description && (
          <p className="text-zinc-600 text-sm mt-3 max-w-2xl">{channel.description}</p>
        )}

        {channel.isSuspended && (
          <div className="mt-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-red-600 text-sm font-medium">This channel has been suspended</p>
          </div>
        )}
      </div>

      {/* Videos */}
      <div className="px-4 md:px-6 pb-6">
        <h2 className="text-base font-semibold text-zinc-900 mb-4">Videos</h2>
        {videos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">No videos uploaded yet.</p>
        )}
      </div>
    </div>
  )
}
