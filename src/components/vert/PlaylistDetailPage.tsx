'use client'

import { useState, useEffect } from 'react'
import { useAuth, useNavigation } from '@/lib/store'
import { VideoCard } from './VideoCard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trash2, ListVideo, Play, X, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { timeAgo } from '@/lib/utils-vert'

interface PlaylistDetailProps {
  playlistId: string
}

interface PlaylistItem {
  id: string
  position: number
  video: {
    id: string
    title: string
    thumbnailUrl: string | null
    durationSeconds: number | null
    viewCount: number
    likeCount: number
    createdAt: string
    format: string
    isRemoved: boolean
    channel: {
      id: string
      channelName: string
      user: { avatarUrl: string | null }
    }
  }
}

interface PlaylistData {
  id: string
  title: string
  description: string | null
  isPublic: boolean
  createdAt: string
  channel: {
    id: string
    channelName: string
    user: { avatarUrl: string | null }
  }
  items: PlaylistItem[]
}

export function PlaylistDetailPage({ playlistId }: PlaylistDetailProps) {
  const { user } = useAuth()
  const { navigate } = useNavigation()
  const { toast } = useToast()
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [removingVideoId, setRemovingVideoId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchPlaylist()
  }, [playlistId])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) navigate({ page: 'login' })
  }, [user, navigate])

  async function fetchPlaylist() {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/playlists/${playlistId}`)
      if (res.ok) {
        const data = await res.json()
        setPlaylist(data.playlist)
      } else if (res.status === 404) {
        setPlaylist(null)
      }
    } catch (error) {
      console.error('Failed to fetch playlist:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveVideo(videoId: string) {
    setRemovingVideoId(videoId)
    try {
      const res = await fetch(`/api/v1/playlists/${playlistId}/items/${videoId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setPlaylist((prev) => prev ? {
          ...prev,
          items: prev.items.filter((item) => item.video.id !== videoId),
        } : null)
        toast({ title: 'Removed from playlist' })
      } else {
        const data = await res.json()
        toast({ title: 'Failed to remove', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Remove video error:', error)
      toast({ title: 'Failed to remove', variant: 'destructive' })
    } finally {
      setRemovingVideoId(null)
    }
  }

  async function handleDeletePlaylist() {
    if (!playlist) return
    if (!confirm(`Delete playlist "${playlist.title}"?\n\nThis removes the playlist but does NOT delete the videos inside it.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/v1/playlists/${playlistId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Playlist deleted', description: playlist.title })
        navigate({ page: 'playlists' })
      } else {
        const data = await res.json()
        toast({ title: 'Failed to delete', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Delete playlist error:', error)
      toast({ title: 'Failed to delete', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              <div className="mt-2 h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ListVideo className="h-10 w-10 text-zinc-400 dark:text-zinc-500 mb-3" />
        <p className="text-zinc-700 dark:text-zinc-300">Playlist not found</p>
        <Button
          variant="ghost"
          onClick={() => navigate({ page: 'playlists' })}
          className="mt-4 text-violet-600"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to playlists
        </Button>
      </div>
    )
  }

  const videos = playlist.items.map((item) => ({
    ...item.video,
  }))

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-vert-fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate({ page: 'playlists' })}
        className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All playlists
      </button>

      {/* Header — title + meta + actions. On mobile the actions stack below
          the title (flex-col); on md+ they sit to the right (md:flex-row). */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{playlist.title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {videos.length} video{videos.length !== 1 ? 's' : ''} · Created {timeAgo(playlist.createdAt)}
          </p>
          {playlist.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-2xl">{playlist.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start">
          {videos.length > 0 && (
            <Button
              onClick={() => navigate({ page: 'video', videoId: videos[0]!.id })}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Play className="h-4 w-4 mr-1.5" />
              Play all
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeletePlaylist}
            disabled={deleting}
            className="border-zinc-200 dark:border-zinc-700 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Videos */}
      {videos.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 mx-auto">
            <Play className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">This playlist is empty</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-xs mx-auto">
            Add videos to this playlist from any video card's menu.
          </p>
          <Button
            onClick={() => navigate({ page: 'home' })}
            className="mt-4 bg-violet-600 hover:bg-violet-700 text-white"
          >
            Browse videos
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="relative group">
              <VideoCard video={video} showContextMenu={false} />
              {/* Remove button overlay — always visible on mobile (no hover),
                  hover-revealed on desktop. Mobile users had no way to remove
                  a video from a playlist without opening it. */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveVideo(video.id)
                }}
                disabled={removingVideoId === video.id}
                className="absolute top-1.5 right-1.5 p-1.5 bg-zinc-900/70 text-white rounded md:opacity-0 md:group-hover:opacity-100 hover:bg-red-600 transition-colors disabled:opacity-50 z-10"
                title="Remove from playlist"
                aria-label={`Remove ${video.title} from playlist`}
              >
                {removingVideoId === video.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
