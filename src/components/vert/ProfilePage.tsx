'use client'

import Image from 'next/image'
import { isNextImageSafeUrl } from '@/lib/image-utils'
import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth, useNavigation } from '@/lib/store'
import { VideoCard } from './VideoCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Settings, Save, BarChart3 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatSubscribers } from '@/lib/utils-vert'

async function fetchChannel(channelId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/v1/channels/${channelId}`)
  if (!res.ok) throw new Error(`Failed to fetch channel: ${res.status}`)
  return res.json()
}

export function ProfilePage() {
  const { user } = useAuth()
  const { navigate } = useNavigation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [failedBannerUrl, setFailedBannerUrl] = useState<string | null>(null)

  // Shares the channel query shape with ChannelPage while keeping the
  // user-specific subscription state in its own cache entry. enabled gates on the
  // user having a channel (old code set loading false in that case).
  const channelKey = ['channel', user?.channelId, user?.id ?? 'anonymous'] as const
  const { data: channelData = null, isLoading: loading } = useQuery({
    queryKey: channelKey,
    queryFn: () => fetchChannel(user!.channelId!),
    enabled: !!user?.channelId,
  })

  // Redirect to login if not authenticated. Previously this was a
  // setState-during-render call (navigate inside the render body), which
  // is a React anti-pattern that can warn in StrictMode and cause subtle
  // re-render bugs. Move it to an effect.
  useEffect(() => {
    if (!user) navigate({ page: 'login' })
  }, [user, navigate])

  // Seed the edit form from the current channel when entering edit mode,
  // instead of syncing server data into form state inside an effect.
  function startEditing() {
    const ch = (channelData as { channel?: { channelName: string; description: string | null } } | null)?.channel
    setChannelName(ch?.channelName ?? '')
    setDescription(ch?.description || '')
    setEditing(true)
  }

  async function handleSave() {
    if (!user?.channelId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/channels/${user.channelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName, description }),
      })
      if (res.ok) {
        toast({ title: 'Channel updated!', description: 'Your changes have been saved.' })
        setEditing(false)
        queryClient.invalidateQueries({ queryKey: channelKey })
      }
    } catch (error) {
      console.error('Channel update error:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    // The effect above will redirect; render a minimal placeholder in
    // the meantime so we don't crash trying to read user.channelId etc.
    return null
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-24 md:h-36 bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="px-4 md:px-6 py-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            <div className="space-y-2 pt-4">
              <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-32 animate-pulse" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const channel = channelData?.channel as {
    id: string
    channelName: string
    description: string | null
    bannerUrl?: string | null
    subscriberCount: number
    videoCount: number
    createdAt: string
  } | undefined

  const bannerUrl = channel?.bannerUrl ?? null
  const hasBanner = Boolean(bannerUrl && failedBannerUrl !== bannerUrl)

  const videos = (channelData?.videos as Array<{
    id: string
    title: string
    thumbnailUrl: string | null
    durationSeconds: number | null
    viewCount: number
    likeCount: number
    createdAt: string
    channel: { id: string; channelName: string; user: { avatarUrl: string | null } }
  }>) || []

  if (!channel) {
    return (
      <div className="max-w-5xl mx-auto animate-vert-fade-in">
        <div className="h-24 md:h-36 bg-gradient-to-br from-violet-100 via-violet-50 to-zinc-100 dark:from-violet-950/40 dark:via-zinc-900 dark:to-zinc-900" />
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-start gap-4">
            <div className="shrink-0 -mt-8">
              <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 text-2xl font-bold border-4 border-white dark:border-zinc-900">
                {user.username[0]?.toUpperCase()}
              </div>
            </div>
            <div className="flex-1 pt-1">
              <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{user.username}</h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-0.5">@{user.username}</p>
            </div>
          </div>
        </div>
        <div className="text-center py-12 px-4">
          <p className="text-zinc-600 dark:text-zinc-400 mb-2">You don&apos;t have a channel yet</p>
          <p className="text-zinc-700 dark:text-zinc-300 text-sm mb-4">Upload your first video to create your channel</p>
          <Button
            onClick={() => navigate({ page: 'upload' })}
            className="bg-violet-600 hover:bg-violet-700 text-white active:scale-95 transition-transform duration-100"
          >
            Upload Your First Video
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto animate-vert-fade-in">
      {/* Profile header — only render the banner area when a custom banner
          exists. Without one, skip the 96-144px of dead space entirely and
          let the avatar sit at the top of the page. */}
      {hasBanner ? (
        <div className="h-24 md:h-36 relative overflow-hidden">
          {bannerUrl && (isNextImageSafeUrl(bannerUrl) ? (
            <Image
              src={bannerUrl}
              alt={channel.channelName}
              fill
              sizes="(max-width: 768px) 100vw, 1024px"
              className="object-cover"
              onError={() => setFailedBannerUrl(bannerUrl)}
            />
          ) : (
            <img
              src={bannerUrl}
              alt={channel.channelName}
              className="w-full h-full object-cover"
              onError={() => setFailedBannerUrl(bannerUrl)}
            />
          ))}
        </div>
      ) : null}

      <div className="px-4 md:px-6 py-4">
        {/* Avatar + info + action buttons — stack vertically on mobile
            so the action buttons (Studio, Edit) don't push the channel
            name off the screen on a 360px viewport. On md+ they sit
            side-by-side as before.
            When there's a banner, the avatar overlaps it via -mt-8.
            When there's no banner, no negative margin is needed. */}
        <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4 ${hasBanner ? '' : 'pt-2'}`}>
          <div className={`shrink-0 self-start ${hasBanner ? '-mt-8' : ''}`}>
            <div className="w-20 h-20 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 text-2xl font-bold border-4 border-white dark:border-zinc-900">
              {user.username[0]?.toUpperCase()}
            </div>
          </div>
          <div className="flex-1 min-w-0 sm:pt-1">
            <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {channel?.channelName || user.username}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-0.5">
              @{user.username} · {formatSubscribers(channel?.subscriberCount || 0)} · {channel?.videoCount || 0} videos
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ page: 'creator-studio' })}
              className="border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Studio
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (editing ? setEditing(false) : startEditing())}
              className="border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Settings className="h-4 w-4 mr-1" />
              {editing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-4">
            <div>
              <Label className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm">Channel Name</Label>
              <Input
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus-visible:ring-violet-600"
              />
            </div>
            <div>
              <Label className="text-zinc-600 dark:text-zinc-400 mb-2 block text-sm">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 min-h-[80px] resize-none focus-visible:ring-violet-600"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-violet-600 hover:bg-violet-700 text-white active:scale-95 transition-transform duration-100"
            >
              {saving ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}

        {!editing && channel?.description && (
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-3 max-w-2xl">{channel.description}</p>
        )}
      </div>

      {/* Videos */}
      <div className="px-4 md:px-6 pb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">My Videos</h2>
        {videos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-700 dark:text-zinc-300">You haven&apos;t uploaded any videos yet</p>
            <Button
              variant="outline"
              onClick={() => navigate({ page: 'upload' })}
              className="mt-4 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Upload Your First Video
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
