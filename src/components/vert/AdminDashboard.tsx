'use client'

import { useState, useEffect } from 'react'
import { useNavigation } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Flag, Trash2, CheckCircle, XCircle, Eye } from 'lucide-react'
import { timeAgo } from '@/lib/utils-vert'

interface FlagItem {
  id: string
  reason: string
  status: string
  createdAt: string
  video: { id: string; title: string; thumbnailUrl: string | null }
  reporter: { id: string; username: string }
}

export function AdminDashboard() {
  const { navigate } = useNavigation()
  const [flags, setFlags] = useState<FlagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('pending')

  useEffect(() => {
    fetchFlags()
  }, [filter])

  async function fetchFlags() {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/admin/flags?status=${filter}&limit=50`)
      const data = await res.json()
      setFlags(data.flags)
    } catch (error) {
      console.error('Failed to fetch flags:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateFlagStatus(flagId: string, status: string) {
    try {
      const res = await fetch(`/api/v1/admin/flags/${flagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setFlags((prev) => prev.filter((f) => f.id !== flagId))
      }
    } catch (error) {
      console.error('Flag update error:', error)
    }
  }

  async function removeVideo(videoId: string, flagId: string) {
    try {
      const res = await fetch(`/api/v1/admin/videos/${videoId}`, { method: 'DELETE' })
      if (res.ok) {
        await updateFlagStatus(flagId, 'actioned')
      }
    } catch (error) {
      console.error('Video remove error:', error)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-600 border-yellow-200',
    reviewed: 'bg-blue-100 text-blue-600 border-blue-200',
    actioned: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    dismissed: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  }

  const reasonLabels: Record<string, string> = {
    spam: 'Spam',
    nudity: 'Nudity',
    hate_speech: 'Hate Speech',
    violence: 'Violence',
    misinformation: 'Misinformation',
    other: 'Other',
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-vert-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-zinc-600" />
        <h1 className="text-xl font-bold text-zinc-900">Admin Dashboard</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6">
        {['pending', 'reviewed', 'actioned', 'dismissed'].map((status) => (
          <Button
            key={status}
            variant="ghost"
            size="sm"
            onClick={() => setFilter(status)}
            className={`text-sm font-medium ${
              filter === status ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-zinc-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : flags.length === 0 ? (
        <div className="text-center py-12">
          <Flag className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-700">No {filter} flags</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="bg-zinc-50 border border-zinc-200 rounded-lg p-4"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Video info */}
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="text-zinc-900 font-medium text-sm">
                        {flag.video.title}
                      </h3>
                      <p className="text-zinc-700 text-xs mt-1">
                        Reported by @{flag.reporter.username} · {timeAgo(flag.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={statusColors[flag.status] || ''}
                    >
                      {flag.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="border-zinc-200 text-zinc-600 text-xs">
                      {reasonLabels[flag.reason] || flag.reason}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                {flag.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateFlagStatus(flag.id, 'reviewed')}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeVideo(flag.video.id, flag.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateFlagStatus(flag.id, 'dismissed')}
                      className="text-zinc-600 hover:text-zinc-600 hover:bg-zinc-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                )}
                {flag.status === 'reviewed' && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateFlagStatus(flag.id, 'actioned')}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Action
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateFlagStatus(flag.id, 'dismissed')}
                      className="text-zinc-600 hover:text-zinc-600 hover:bg-zinc-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
