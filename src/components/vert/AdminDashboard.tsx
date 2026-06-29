'use client'

import { useState, useEffect } from 'react'
import { useNavigation } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  Flag,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  BarChart3,
  Users,
  Film,
  PlayCircle,
  UserCircle,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { timeAgo, formatViews } from '@/lib/utils-vert'

interface FlagItem {
  id: string
  reason: string
  status: string
  createdAt: string
  video: { id: string; title: string; thumbnailUrl: string | null }
  reporter: { id: string; username: string }
}

interface AdminAnalytics {
  overview: {
    totalUsers: number
    totalVideos: number
    totalChannels: number
    totalViews: number
    flagsPending: number
  }
  growth: {
    newUsers: number
    newVideos: number
    newChannels: number
    since: string
  }
  topVideos: Array<{
    id: string
    title: string
    viewCount: number
    likeCount: number
    channelId: string
    channelName: string
  }>
  topChannels: Array<{
    id: string
    channelName: string
    subscriberCount: number
    videoCount: number
  }>
  flagBreakdown: {
    pending: number
    reviewed: number
    actioned: number
    dismissed: number
  }
}

type Tab = 'analytics' | 'flags'

export function AdminDashboard() {
  const { navigate } = useNavigation()
  const [tab, setTab] = useState<Tab>('analytics')

  // Flags state
  const [flags, setFlags] = useState<FlagItem[]>([])
  const [flagsLoading, setFlagsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('pending')

  // Analytics state
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  useEffect(() => {
    if (tab === 'flags') fetchFlags()
  }, [tab, filter])

  useEffect(() => {
    if (tab === 'analytics') fetchAnalytics()
  }, [tab])

  async function fetchFlags() {
    setFlagsLoading(true)
    try {
      const res = await fetch(`/api/v1/admin/flags?status=${filter}&limit=50`)
      const data = await res.json()
      setFlags(data.flags)
    } catch (error) {
      console.error('Failed to fetch flags:', error)
    } finally {
      setFlagsLoading(false)
    }
  }

  async function fetchAnalytics() {
    setAnalyticsLoading(true)
    try {
      const res = await fetch('/api/v1/admin/analytics')
      if (res.ok) setAnalytics(await res.json())
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setAnalyticsLoading(false)
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
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-zinc-600" />
        <h1 className="text-xl font-bold text-zinc-900">Admin Dashboard</h1>
      </div>

      {/* Top-level tab switcher: Analytics | Flags */}
      <div className="flex gap-1 mb-6 border-b border-zinc-200">
        <button
          onClick={() => setTab('analytics')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'analytics'
              ? 'border-violet-600 text-zinc-900'
              : 'border-transparent text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Analytics
        </button>
        <button
          onClick={() => setTab('flags')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'flags'
              ? 'border-violet-600 text-zinc-900'
              : 'border-transparent text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <Flag className="h-4 w-4" />
          Flags
          {analytics && analytics.flagBreakdown.pending > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-semibold">
              {analytics.flagBreakdown.pending}
            </span>
          )}
        </button>
      </div>

      {/* ================= ANALYTICS TAB ================= */}
      {tab === 'analytics' && (
        <>
          {analyticsLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-24 bg-zinc-200 rounded-lg animate-pulse" />
                ))}
              </div>
              <div className="h-48 bg-zinc-200 rounded-lg animate-pulse" />
              <div className="h-48 bg-zinc-200 rounded-lg animate-pulse" />
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Overview stat cards */}
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 mb-3">Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <StatCard icon={Users} label="Total Users" value={analytics.overview.totalUsers} color="text-violet-600" />
                  <StatCard icon={Film} label="Total Videos" value={analytics.overview.totalVideos} color="text-emerald-600" />
                  <StatCard icon={PlayCircle} label="Total Views" value={analytics.overview.totalViews} color="text-blue-600" />
                  <StatCard icon={UserCircle} label="Channels" value={analytics.overview.totalChannels} color="text-amber-600" />
                  <StatCard icon={AlertTriangle} label="Flags Pending" value={analytics.overview.flagsPending} color="text-red-600" />
                </div>
              </div>

              {/* Growth section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-zinc-600" />
                  <h2 className="text-sm font-semibold text-zinc-900">Growth (Last 30 Days)</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <StatCard icon={Users} label="New Users" value={analytics.growth.newUsers} color="text-violet-600" />
                  <StatCard icon={Film} label="New Videos" value={analytics.growth.newVideos} color="text-emerald-600" />
                  <StatCard icon={UserCircle} label="New Channels" value={analytics.growth.newChannels} color="text-amber-600" />
                </div>
              </div>

              {/* Flag breakdown */}
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 mb-3">Flag Breakdown</h2>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={statusColors.pending}>
                    {analytics.flagBreakdown.pending} Pending
                  </Badge>
                  <Badge variant="outline" className={statusColors.reviewed}>
                    {analytics.flagBreakdown.reviewed} Reviewed
                  </Badge>
                  <Badge variant="outline" className={statusColors.actioned}>
                    {analytics.flagBreakdown.actioned} Actioned
                  </Badge>
                  <Badge variant="outline" className={statusColors.dismissed}>
                    {analytics.flagBreakdown.dismissed} Dismissed
                  </Badge>
                </div>
              </div>

              {/* Top 5 Videos */}
              <div className="bg-zinc-50 rounded-lg border border-zinc-200 overflow-hidden">
                <div className="p-4 border-b border-zinc-200">
                  <h2 className="text-sm font-semibold text-zinc-900">Top 5 Videos</h2>
                </div>
                {analytics.topVideos.length === 0 ? (
                  <div className="p-6 text-center text-zinc-700 text-sm">No videos yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-100">
                          <th className="text-left text-xs font-medium text-zinc-700 px-4 py-3">Title</th>
                          <th className="text-left text-xs font-medium text-zinc-700 px-4 py-3">Channel</th>
                          <th className="text-right text-xs font-medium text-zinc-700 px-4 py-3">Views</th>
                          <th className="text-right text-xs font-medium text-zinc-700 px-4 py-3">Likes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.topVideos.map((v) => (
                          <tr
                            key={v.id}
                            className="border-b border-zinc-100 hover:bg-zinc-100 cursor-pointer transition-colors"
                            onClick={() => navigate({ page: 'video', videoId: v.id })}
                          >
                            <td className="px-4 py-3 text-sm text-zinc-900 font-medium line-clamp-1 max-w-xs">{v.title}</td>
                            <td className="px-4 py-3 text-sm text-zinc-700">{v.channelName}</td>
                            <td className="text-right px-4 py-3 text-sm text-zinc-600">{formatViews(v.viewCount)}</td>
                            <td className="text-right px-4 py-3 text-sm text-zinc-600">{formatViews(v.likeCount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Top 5 Channels */}
              <div className="bg-zinc-50 rounded-lg border border-zinc-200 overflow-hidden">
                <div className="p-4 border-b border-zinc-200">
                  <h2 className="text-sm font-semibold text-zinc-900">Top 5 Channels</h2>
                </div>
                {analytics.topChannels.length === 0 ? (
                  <div className="p-6 text-center text-zinc-700 text-sm">No channels yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-100">
                          <th className="text-left text-xs font-medium text-zinc-700 px-4 py-3">Channel</th>
                          <th className="text-right text-xs font-medium text-zinc-700 px-4 py-3">Subscribers</th>
                          <th className="text-right text-xs font-medium text-zinc-700 px-4 py-3">Videos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.topChannels.map((c) => (
                          <tr
                            key={c.id}
                            className="border-b border-zinc-100 hover:bg-zinc-100 cursor-pointer transition-colors"
                            onClick={() => navigate({ page: 'channel', channelId: c.id })}
                          >
                            <td className="px-4 py-3 text-sm text-zinc-900 font-medium">{c.channelName}</td>
                            <td className="text-right px-4 py-3 text-sm text-zinc-600">{formatViews(c.subscriberCount)}</td>
                            <td className="text-right px-4 py-3 text-sm text-zinc-600">{c.videoCount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-700">Failed to load analytics.</div>
          )}
        </>
      )}

      {/* ================= FLAGS TAB ================= */}
      {tab === 'flags' && (
        <>
          {/* Status filter */}
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

          {flagsLoading ? (
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
        </>
      )}
    </div>
  )
}

// Reusable stat card sub-component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
}) {
  return (
    <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-xl font-bold text-zinc-900">
        {value > 999 ? formatViews(value) : value.toLocaleString()}
      </p>
      <p className="text-xs text-zinc-700 mt-1">{label}</p>
    </div>
  )
}
