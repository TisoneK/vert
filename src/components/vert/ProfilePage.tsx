'use client'

import { useState, useEffect } from 'react'
import { useAuth, useNavigation } from '@/lib/store'
import { VideoCard } from './VideoCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Settings, Save, BarChart3, Film } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatSubscribers } from '@/lib/utils-vert'
import { CardSkeleton } from './Skeleton'

export function ProfilePage() {
  const { user, setUser } = useAuth()
  const { navigate } = useNavigation()
  const { toast } = useToast()
  const [channelData, setChannelData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Redirect to login if not authenticated. Previously this was a
  // setState-during-render call (navigate inside the render body), which
  // is a React anti-pattern that can warn in StrictMode and cause subtle
  // re-render bugs. Move it to an effect.
  useEffect(() => {
    if (!user) navigate({ page: 'login' })
  }, [user, navigate])

  useEffect(() => {
    if (user?.channelId) {
      fetchChannel()
    } else {
      setLoading(false)
    }
  }, [user?.channelId])

  async function fetchChannel() {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/channels/${user!.channelId}`)
      if (res.ok) {
        const data = await res.json()
        setChannelData(data)
        const ch = data.channel as { channelName: string; description: string | null }
        setChannelName(ch.channelName)
        setDescription(ch.description || '')
      }
    } catch (error) {
      console.error('Failed to fetch channel:', error)
    } finally {
      setLoading(false)
    }
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
        fetchChannel()
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
        <div className="h-24 md:h-36 bg-gradient-to-br from-violet-100 via-violet-50 to-zinc-100" />
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
      {channel.bannerUrl ? (
        <div className="h-24 md:h-36 relative overflow-hidden">
          <img
            src={channel.bannerUrl}
            alt={channel.channelName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}

      <div className="px-4 md:px-6 py-4">
        {/* Avatar + info + action buttons — stack vertically on mobile
            so the action buttons (Studio, Edit) don't push the channel
            name off the screen on a 360px viewport. On md+ they sit
            side-by-side as before.
            When there's a banner, the avatar overlaps it via -mt-8.
            When there's no banner, no negative margin is needed. */}
        <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4 ${channel.bannerUrl ? '' : 'pt-2'}`}>
          <div className={`shrink-0 self-start ${channel.bannerUrl ? '-mt-8' : ''}`}>
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
              onClick={() => setEditing(!editing)}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
