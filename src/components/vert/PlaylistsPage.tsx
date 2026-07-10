'use client'

import { useState, useEffect } from 'react'
import { useAuth, useNavigation } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, ListVideo, Film, X, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { timeAgo } from '@/lib/utils-vert'

interface Playlist {
  id: string
  title: string
  description: string | null
  isPublic: boolean
  createdAt: string
  videoCount: number
  thumbnailUrl: string | null
}

export function PlaylistsPage() {
  const { user } = useAuth()
  const { navigate } = useNavigation()
  const { toast } = useToast()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPlaylists()
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) navigate({ page: 'login' })
  }, [user, navigate])

  async function fetchPlaylists() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/playlists')
      if (res.ok) {
        const data = await res.json()
        setPlaylists(data.playlists ?? [])
      }
    } catch (error) {
      console.error('Failed to fetch playlists:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/v1/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Playlist created!', description: newTitle.trim() })
        setNewTitle('')
        setNewDescription('')
        setShowCreate(false)
        fetchPlaylists()
      } else {
        toast({ title: 'Failed to create', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Create playlist error:', error)
      toast({ title: 'Failed to create', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(playlistId: string, title: string) {
    if (!confirm(`Delete playlist "${title}"?\n\nThis removes the playlist but does NOT delete the videos inside it.`)) return
    setDeletingId(playlistId)
    try {
      const res = await fetch(`/api/v1/playlists/${playlistId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Playlist deleted', description: title })
        setPlaylists((prev) => prev.filter((p) => p.id !== playlistId))
      } else {
        const data = await res.json()
        toast({ title: 'Failed to delete', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Delete playlist error:', error)
      toast({ title: 'Failed to delete', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
                <div className="aspect-video rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-2 h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="mt-1 h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-vert-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ListVideo className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">My Playlists</h1>
          {playlists.length > 0 && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">({playlists.length})</span>
          )}
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-violet-600 hover:bg-violet-700 text-white font-medium active:scale-95 transition-transform duration-100"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Playlist
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-3 animate-vert-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Create new playlist</h2>
            <button onClick={() => setShowCreate(false)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div>
            <Label className="text-zinc-600 dark:text-zinc-400 mb-1.5 block text-sm">Title *</Label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="My favorite videos"
              className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-violet-600"
              maxLength={100}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && !creating && handleCreate()}
            />
          </div>
          <div>
            <Label className="text-zinc-600 dark:text-zinc-400 mb-1.5 block text-sm">Description</Label>
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="What's this playlist about?"
              className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 min-h-[60px] resize-none focus-visible:ring-violet-600"
              maxLength={1000}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newTitle.trim() || creating}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Playlists grid */}
      {playlists.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 mx-auto">
            <ListVideo className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">No playlists yet</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-xs mx-auto">
            Create a playlist to organize your favorite videos, then add videos
            from any video card's menu.
          </p>
          <Button
            onClick={() => setShowCreate(true)}
            className="mt-4 bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create your first playlist
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="group cursor-pointer"
              onClick={() => navigate({ page: 'playlist', playlistId: playlist.id })}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                {playlist.thumbnailUrl ? (
                  <img
                    src={playlist.thumbnailUrl}
                    alt={playlist.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
                  </div>
                )}
                {/* Video count badge */}
                <div className="absolute bottom-1.5 right-1.5 bg-zinc-900/80 text-white text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                  <ListVideo className="h-3 w-3" />
                  {playlist.videoCount}
                </div>
                {/* Delete button — always visible on mobile (no hover),
                    hover-revealed on desktop. Mobile users otherwise had no
                    way to delete a playlist from this page. */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(playlist.id, playlist.title)
                  }}
                  disabled={deletingId === playlist.id}
                  className="absolute top-1.5 right-1.5 p-1.5 bg-zinc-900/70 text-white rounded md:opacity-0 md:group-hover:opacity-100 hover:bg-red-600 transition-colors disabled:opacity-50"
                  title="Delete playlist"
                  aria-label={`Delete playlist ${playlist.title}`}
                >
                  {deletingId === playlist.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {/* Title + meta */}
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-2 line-clamp-2 leading-tight">
                {playlist.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {playlist.videoCount} video{playlist.videoCount !== 1 ? 's' : ''} · {timeAgo(playlist.createdAt)}
              </p>
              {playlist.description && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-1">{playlist.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
