'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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

interface PickerData {
  playlists: Playlist[]
  containedIn: Set<string>
}

// Fetches the user's playlists plus which of them already contain this video
// (N+1 detail requests, but only run when the modal opens and N is small).
async function fetchPlaylistsWithContainment(videoId: string): Promise<PickerData> {
  const res = await fetch('/api/v1/playlists')
  if (!res.ok) throw new Error(`Failed to fetch playlists: ${res.status}`)
  const data = await res.json()
  const pls: Playlist[] = data.playlists ?? []
  const contained = new Set<string>()
  await Promise.all(
    pls.map(async (pl) => {
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
  return { playlists: pls, containedIn: contained }
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
  const queryClient = useQueryClient()
  const pickerKey = ['playlist-picker', videoId, user?.id] as const
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Only fetches while the modal is open for a signed-in user.
  const { data, isLoading: loading } = useQuery({
    queryKey: pickerKey,
    queryFn: () => fetchPlaylistsWithContainment(videoId),
    enabled: open && !!user,
  })
  const playlists = data?.playlists ?? []
  const containedIn = data?.containedIn ?? new Set<string>()

  // Focus the title input when the create form opens
  useEffect(() => {
    if (showCreate && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [showCreate])

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
          queryClient.setQueryData<PickerData>(pickerKey, (prev) => prev ? {
            playlists: prev.playlists.map((p) =>
              p.id === playlistId ? { ...p, videoCount: Math.max(0, p.videoCount - 1) } : p
            ),
            containedIn: new Set([...prev.containedIn].filter((id) => id !== playlistId)),
          } : prev)
        }
      } else {
        // Add to playlist
        const res = await fetch(`/api/v1/playlists/${playlistId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId }),
        })
        if (res.ok) {
          queryClient.setQueryData<PickerData>(pickerKey, (prev) => prev ? {
            playlists: prev.playlists.map((p) =>
              p.id === playlistId ? { ...p, videoCount: p.videoCount + 1 } : p
            ),
            containedIn: new Set(prev.containedIn).add(playlistId),
          } : prev)
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
        queryClient.setQueryData<PickerData>(pickerKey, (prev) => prev
          ? { playlists: [newPl, ...prev.playlists], containedIn: prev.containedIn }
          : { playlists: [newPl], containedIn: new Set<string>() })
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
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListVideo className="h-5 w-5 text-violet-600" />
            Add to playlist
          </DialogTitle>
          <DialogDescription className="text-zinc-700 dark:text-zinc-300">
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
              className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-violet-600"
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
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors border border-dashed border-violet-200 dark:border-violet-800"
          >
            <Plus className="h-4 w-4" />
            Create new playlist
          </button>
        )}

        {/* Playlists list */}
        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400 dark:text-zinc-500 mx-auto" />
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">Loading your playlists…</p>
          </div>
        ) : playlists.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
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
                      ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-900 dark:text-violet-400'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  } disabled:opacity-50`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{pl.title}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
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
