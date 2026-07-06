'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ListVideo, Plus, Check, Loader2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PlaylistPickerProps {
  videoId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Playlist {
  id: string
  title: string
  videoCount: number
  thumbnailUrl: string | null
}

/**
 * Playlist picker modal — shown when a user clicks "Add to playlist"
 * on a VideoCard context menu.
 *
 * Lists the user's playlists with a checkmark showing which ones
 * already contain this video. Clicking a playlist toggles the video
 * in/out. Also has an inline "create new playlist" form at the bottom.
 */
export function PlaylistPicker({ videoId, open, onOpenChange }: PlaylistPickerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [containedIn, setContainedIn] = useState<Set<string>>(new Set())
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Fetch playlists + check which ones already contain this video
  useEffect(() => {
    if (!open || !user) return
    fetchPlaylists()
  }, [open, user])

  // Focus the title input when the create form opens
  useEffect(() => {
    if (showCreate && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [showCreate])

  async function fetchPlaylists() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/playlists')
      if (res.ok) {
        const data = await res.json()
        const pls = data.playlists ?? []
        setPlaylists(pls)
        // Check which playlists already contain this video — fetch each
        // playlist's items. This is N requests, but N is typically small
        // (most users have < 10 playlists) and we only do it on modal open.
        const contained = new Set<string>()
        await Promise.all(
          pls.map(async (pl: Playlist) => {
            try {
              const detailRes = await fetch(`/api/v1/playlists/${pl.id}`)
              if (detailRes.ok) {
                const detail = await detailRes.json()
                const hasVideo = detail.playlist?.items?.some(
                  (item: { video: { id: string } }) => item.video.id === videoId
                )
                if (hasVideo) contained.add(pl.id)
              }
            } catch {
              // ignore — individual playlist failures shouldn't block the modal
            }
          })
        )
        setContainedIn(contained)
      }
    } catch (error) {
      console.error('Failed to fetch playlists:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(playlistId: string) {
    setTogglingId(playlistId)
    const wasContained = containedIn.has(playlistId)
    try {
      if (wasContained) {
        // Remove from playlist
        const res = await fetch(`/api/v1/playlists/${playlistId}/items/${videoId}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          setContainedIn((prev) => {
            const next = new Set(prev)
            next.delete(playlistId)
            return next
          })
          setPlaylists((prev) =>
            prev.map((p) =>
              p.id === playlistId ? { ...p, videoCount: Math.max(0, p.videoCount - 1) } : p
            )
          )
        }
      } else {
        // Add to playlist
        const res = await fetch(`/api/v1/playlists/${playlistId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId }),
        })
        if (res.ok) {
          setContainedIn((prev) => new Set(prev).add(playlistId))
          setPlaylists((prev) =>
            prev.map((p) =>
              p.id === playlistId ? { ...p, videoCount: p.videoCount + 1 } : p
            )
          )
        } else {
          const data = await res.json()
          toast({ title: 'Failed', description: data.error, variant: 'destructive' })
        }
      }
    } catch (error) {
      console.error('Toggle playlist error:', error)
      toast({ title: 'Failed', variant: 'destructive' })
    } finally {
      setTogglingId(null)
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/v1/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        // Add the new playlist to the list, then immediately add the video to it
        const newPl: Playlist = {
          id: data.playlist.id,
          title: data.playlist.title,
          videoCount: 0,
          thumbnailUrl: null,
        }
        setPlaylists((prev) => [newPl, ...prev])
        setNewTitle('')
        setShowCreate(false)
        // Auto-add the video to the new playlist
        await handleToggle(newPl.id)
        toast({ title: 'Playlist created', description: `"${newPl.title}" with 1 video` })
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

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-zinc-200 text-zinc-900 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListVideo className="h-5 w-5 text-violet-600" />
            Add to playlist
          </DialogTitle>
          <DialogDescription className="text-zinc-700">
            Select a playlist to add this video to, or create a new one.
          </DialogDescription>
        </DialogHeader>

        {/* Create form */}
        {showCreate ? (
          <div className="space-y-2 pb-2">
            <Input
              ref={titleInputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Playlist name"
              className="bg-zinc-50 border-zinc-300 text-zinc-800 placeholder:text-zinc-400 focus-visible:ring-violet-600"
              maxLength={100}
              onKeyDown={(e) => e.key === 'Enter' && !creating && handleCreate()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowCreate(false); setNewTitle('') }}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!newTitle.trim() || creating}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create & add'}
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors border border-dashed border-violet-200"
          >
            <Plus className="h-4 w-4" />
            Create new playlist
          </button>
        )}

        {/* Playlists list */}
        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mx-auto" />
            <p className="text-xs text-zinc-400 mt-2">Loading your playlists…</p>
          </div>
        ) : playlists.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-500">
            No playlists yet. Create one above to get started.
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-1">
            {playlists.map((pl) => {
              const isContained = containedIn.has(pl.id)
              const isToggling = togglingId === pl.id
              return (
                <button
                  key={pl.id}
                  onClick={() => handleToggle(pl.id)}
                  disabled={isToggling}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    isContained
                      ? 'bg-violet-50 text-violet-900'
                      : 'text-zinc-700 hover:bg-zinc-100'
                  } disabled:opacity-50`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{pl.title}</p>
                    <p className="text-xs text-zinc-400">
                      {pl.videoCount} video{pl.videoCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {isToggling ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400 shrink-0" />
                  ) : isContained ? (
                    <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <Plus className="h-4 w-4 text-zinc-400 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
