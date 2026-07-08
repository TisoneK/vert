'use client'

import { useState, useEffect } from 'react'
import { useNavigation } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Database,
  Play,
  RefreshCw,
  Loader2,
  Search,
  UserCog,
  UserX,
  UserCheck,
  UserPlus,
  X,
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

type Tab = 'analytics' | 'flags' | 'database' | 'users'

interface DbMigration {
  id: string
  filename: string
  description: string
  applied: boolean
  appliedAt?: string
}

interface AdminUser {
  id: string
  email: string
  username: string
  role: string
  isActive: boolean
  emailVerified: boolean
  oauthProvider: string | null
  avatarUrl: string | null
  createdAt: string
  lastSeenAt: string | null
  channel: { id: string; channelName: string; isSuspended: boolean } | null
  videoCount: number
  commentCount: number
}

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

  // Database migrations state
  const [migrations, setMigrations] = useState<DbMigration[]>([])
  const [migrationsLoading, setMigrationsLoading] = useState(true)
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [migrationError, setMigrationError] = useState<string | null>(null)
  const [migrationSuccess, setMigrationSuccess] = useState<string | null>(null)

  // Users state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<string>('')
  const [userActionId, setUserActionId] = useState<string | null>(null)
  const [userError, setUserError] = useState<string | null>(null)

  // Test account creation state
  const [showCreateTest, setShowCreateTest] = useState(false)
  const [testCount, setTestCount] = useState(3)
  const [creatingTest, setCreatingTest] = useState(false)
  const [testResult, setTestResult] = useState<{ created: number; users: Array<{ email: string; username: string; password: string; channelName: string }>; note: string } | null>(null)

  useEffect(() => {
    if (tab === 'flags') fetchFlags()
  }, [tab, filter])

  useEffect(() => {
    if (tab === 'analytics') fetchAnalytics()
  }, [tab])

  useEffect(() => {
    if (tab === 'database') fetchMigrations()
  }, [tab])

  useEffect(() => {
    if (tab === 'users') fetchAdminUsers()
  }, [tab, userRoleFilter])

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

  async function fetchMigrations() {
    setMigrationsLoading(true)
    setMigrationError(null)
    setMigrationSuccess(null)
    try {
      const res = await fetch('/api/v1/admin/db-migrations')
      if (res.ok) {
        const data = await res.json()
        setMigrations(data.migrations ?? [])
      } else {
        setMigrationError('Failed to load migrations')
      }
    } catch (error) {
      console.error('Failed to fetch migrations:', error)
      setMigrationError('Network error loading migrations')
    } finally {
      setMigrationsLoading(false)
    }
  }

  async function applyMigrationById(id: string) {
    // Confirm before running — migrations are irreversible.
    if (!confirm(
      `Apply migration "${id}"?\n\n` +
      `This will run SQL against the production database and cannot be undone.`
    )) return

    setApplyingId(id)
    setMigrationError(null)
    setMigrationSuccess(null)
    try {
      const res = await fetch(`/api/v1/admin/db-migrations/${id}/apply`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        setMigrationSuccess(`✓ Applied: ${id}`)
        // Refresh the list to reflect the new state
        await fetchMigrations()
      } else {
        setMigrationError(data.error || `Failed to apply: ${id}`)
      }
    } catch (error) {
      console.error('Migration apply error:', error)
      setMigrationError(`Network error applying: ${id}`)
    } finally {
      setApplyingId(null)
    }
  }

  async function fetchAdminUsers(searchQuery?: string) {
    setUsersLoading(true)
    setUserError(null)
    try {
      const params = new URLSearchParams()
      if (searchQuery && searchQuery.trim()) params.set('q', searchQuery.trim())
      if (userRoleFilter) params.set('role', userRoleFilter)
      params.set('limit', '50')
      const res = await fetch(`/api/v1/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAdminUsers(data.users ?? [])
      } else {
        setUserError('Failed to load users')
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setUserError('Network error loading users')
    } finally {
      setUsersLoading(false)
    }
  }

  async function updateUserRole(userId: string, newRole: 'member' | 'admin') {
    setUserActionId(userId)
    setUserError(null)
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (res.ok) {
        setAdminUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        )
      } else {
        setUserError(data.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Role update error:', error)
      setUserError('Network error updating role')
    } finally {
      setUserActionId(null)
    }
  }

  async function toggleUserActive(userId: string, currentlyActive: boolean) {
    const action = currentlyActive ? 'deactivate' : 'activate'
    if (!confirm(`Are you sure you want to ${action} this user?\n\n${
      currentlyActive
        ? 'They will be signed out and unable to log in.'
        : 'They will be able to log in again.'
    }`)) return

    setUserActionId(userId)
    setUserError(null)
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentlyActive }),
      })
      const data = await res.json()
      if (res.ok) {
        setAdminUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isActive: !currentlyActive } : u
          )
        )
      } else {
        setUserError(data.error || `Failed to ${action} user`)
      }
    } catch (error) {
      console.error('Toggle active error:', error)
      setUserError(`Network error: ${action} user`)
    } finally {
      setUserActionId(null)
    }
  }

  async function deleteUser(userId: string, username: string) {
    if (!confirm(
      `Permanently delete user "${username}"?\n\n` +
      `This CANNOT be undone. Their channel, videos, comments, votes, and ` +
      `playlists will be cascade-deleted.\n\n` +
      `Consider deactivating instead (preserves their content).`
    )) return

    // Second confirm for destructive action
    if (!confirm('Are you absolutely sure? This is irreversible.')) return

    setUserActionId(userId)
    setUserError(null)
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      const data = await res.json()
      if (res.ok) {
        setAdminUsers((prev) => prev.filter((u) => u.id !== userId))
      } else {
        setUserError(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Delete user error:', error)
      setUserError('Network error deleting user')
    } finally {
      setUserActionId(null)
    }
  }

  async function handleCreateTestUsers() {
    setCreatingTest(true)
    setUserError(null)
    try {
      const res = await fetch('/api/v1/admin/create-test-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: testCount }),
      })
      const data = await res.json()
      if (res.ok) {
        setTestResult(data)
        setShowCreateTest(false)
        // Refresh the user list so the new accounts show up
        fetchAdminUsers(userSearch)
      } else {
        setUserError(data.error || 'Failed to create test users')
      }
    } catch (error) {
      console.error('Create test users error:', error)
      setUserError('Network error creating test users')
    } finally {
      setCreatingTest(false)
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
    reviewed: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
    actioned: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    dismissed: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
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
        <Shield className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Admin Dashboard</h1>
      </div>

      {/* Top-level tab switcher: Analytics | Flags | Database | Users.
          Horizontally scrollable on mobile so all 4 tabs stay visible
          without wrapping or pushing the page width. The scroll-fade
          class adds a right-edge fade hint when there's more to scroll. */}
      <div className="flex gap-1 mb-6 border-b border-zinc-200 dark:border-zinc-700 overflow-x-auto shelf-scroll scroll-fade">
        <button
          onClick={() => setTab('analytics')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px shrink-0 ${
            tab === 'analytics'
              ? 'border-violet-600 text-zinc-900 dark:text-zinc-100'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Analytics
        </button>
        <button
          onClick={() => setTab('flags')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px shrink-0 ${
            tab === 'flags'
              ? 'border-violet-600 text-zinc-900 dark:text-zinc-100'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
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
        <button
          onClick={() => setTab('database')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px shrink-0 ${
            tab === 'database'
              ? 'border-violet-600 text-zinc-900 dark:text-zinc-100'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Database className="h-4 w-4" />
          Database
          {migrations.some((m) => !m.applied) && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 text-[10px] font-semibold">
              {migrations.filter((m) => !m.applied).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('users')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px shrink-0 ${
            tab === 'users'
              ? 'border-violet-600 text-zinc-900 dark:text-zinc-100'
              : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Users className="h-4 w-4" />
          Users
        </button>
      </div>

      {/* ================= ANALYTICS TAB ================= */}
      {tab === 'analytics' && (
        <>
          {analyticsLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                ))}
              </div>
              <div className="h-48 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
              <div className="h-48 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Overview stat cards */}
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                  <TrendingUp className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Growth (Last 30 Days)</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <StatCard icon={Users} label="New Users" value={analytics.growth.newUsers} color="text-violet-600" />
                  <StatCard icon={Film} label="New Videos" value={analytics.growth.newVideos} color="text-emerald-600" />
                  <StatCard icon={UserCircle} label="New Channels" value={analytics.growth.newChannels} color="text-amber-600" />
                </div>
              </div>

              {/* Flag breakdown */}
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Flag Breakdown</h2>
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
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Top 5 Videos</h2>
                </div>
                {analytics.topVideos.length === 0 ? (
                  <div className="p-6 text-center text-zinc-500 dark:text-zinc-400 text-sm">No videos.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800">
                          <th className="text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 px-4 py-3">Title</th>
                          <th className="text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 px-4 py-3">Channel</th>
                          <th className="text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 px-4 py-3">Views</th>
                          <th className="text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 px-4 py-3">Likes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.topVideos.map((v) => (
                          <tr
                            key={v.id}
                            className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                            onClick={() => navigate({ page: 'video', videoId: v.id })}
                          >
                            <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 font-medium line-clamp-1 max-w-xs">{v.title}</td>
                            <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{v.channelName}</td>
                            <td className="text-right px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{formatViews(v.viewCount)}</td>
                            <td className="text-right px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{formatViews(v.likeCount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Top 5 Channels */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Top 5 Channels</h2>
                </div>
                {analytics.topChannels.length === 0 ? (
                  <div className="p-6 text-center text-zinc-500 dark:text-zinc-400 text-sm">No channels.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800">
                          <th className="text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 px-4 py-3">Channel</th>
                          <th className="text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 px-4 py-3">Subscribers</th>
                          <th className="text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 px-4 py-3">Videos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.topChannels.map((c) => (
                          <tr
                            key={c.id}
                            className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                            onClick={() => navigate({ page: 'channel', channelId: c.id })}
                          >
                            <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 font-medium">{c.channelName}</td>
                            <td className="text-right px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{formatViews(c.subscriberCount)}</td>
                            <td className="text-right px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{c.videoCount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-700 dark:text-zinc-300">Failed to load analytics.</div>
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
                  filter === status ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>

          {flagsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : flags.length === 0 ? (
            <div className="text-center py-12">
              <Flag className="h-10 w-10 text-zinc-600 dark:text-zinc-400 mx-auto mb-3" />
              <p className="text-zinc-700 dark:text-zinc-300">No {filter} flags</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flags.map((flag) => (
                <div
                  key={flag.id}
                  className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Video info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="text-zinc-900 dark:text-zinc-100 font-medium text-sm">
                            {flag.video.title}
                          </h3>
                          <p className="text-zinc-700 dark:text-zinc-300 text-xs mt-1">
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
                        <Badge variant="outline" className="border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs">
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
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeVideo(flag.video.id, flag.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateFlagStatus(flag.id, 'dismissed')}
                          className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
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
                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Action
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateFlagStatus(flag.id, 'dismissed')}
                          className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
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

      {/* ================= DATABASE TAB ================= */}
      {tab === 'database' && (
        <div className="space-y-4">
          {/* Warning banner */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Schema migrations run SQL against the production database.
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                Each migration is wrapped in a transaction and tracked in
                the <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded">_admin_migration</code> table.
                Applied migrations cannot be undone from the UI — review the SQL before applying.
                CLI alternative: <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded">./scripts/apply-admin-migrations.sh</code>
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchMigrations}
              disabled={migrationsLoading}
              className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${migrationsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Status messages */}
          {migrationError && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
              {migrationError}
            </div>
          )}
          {migrationSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3 text-sm text-emerald-700 dark:text-emerald-400">
              {migrationSuccess}
            </div>
          )}

          {/* Loading state */}
          {migrationsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : migrations.length === 0 ? (
            <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <Database className="h-10 w-10 text-zinc-400 dark:text-zinc-500 mx-auto mb-3" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">No migrations found</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                Add SQL files to <code className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">prisma/migrations/admin/</code>
              </p>
            </div>
          ) : (
            <>
              {/* Pending migrations */}
              {migrations.filter((m) => !m.applied).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Pending ({migrations.filter((m) => !m.applied).length})
                  </h3>
                  <div className="space-y-2">
                    {migrations.filter((m) => !m.applied).map((m) => (
                      <div
                        key={m.id}
                        className="bg-white dark:bg-zinc-800 border border-orange-200 dark:border-orange-900 rounded-lg p-4 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{m.id}</code>
                            <Badge variant="outline" className="border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-400 text-[10px]">
                              pending
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-1">{m.description}</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 font-mono">
                            prisma/migrations/admin/{m.filename}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => applyMigrationById(m.id)}
                          disabled={applyingId !== null}
                          className="bg-violet-600 hover:bg-violet-700 text-white shrink-0"
                        >
                          {applyingId === m.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              Applying…
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 mr-1.5" />
                              Apply
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Applied migrations */}
              {migrations.filter((m) => m.applied).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2 mt-6">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Applied ({migrations.filter((m) => m.applied).length})
                  </h3>
                  <div className="space-y-2">
                    {migrations.filter((m) => m.applied).map((m) => (
                      <div
                        key={m.id}
                        className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{m.id}</code>
                            <Badge variant="outline" className="border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-[10px]">
                              <CheckCircle className="h-3 w-3 mr-0.5" />
                              applied
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{m.description}</p>
                        </div>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
                          {m.appliedAt ? new Date(m.appliedAt).toLocaleString() : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All caught up */}
              {migrations.every((m) => m.applied) && (
                <div className="text-center py-8 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">All migrations applied</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">Database schema is up to date.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ================= USERS TAB ================= */}
      {tab === 'users' && (
        <div className="space-y-4">
          {/* Search + filter bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                fetchAdminUsers(userSearch)
              }}
              className="flex-1 relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by email or username…"
                className="pl-9 bg-white border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:text-zinc-500 focus-visible:ring-violet-600"
              />
            </form>
            <div className="flex gap-1">
              {['', 'member', 'admin'].map((r) => (
                <Button
                  key={r || 'all'}
                  variant={userRoleFilter === r ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserRoleFilter(r)}
                  className={userRoleFilter === r ? 'bg-violet-600 text-white' : ''}
                >
                  {r === '' ? 'All' : r === 'member' ? 'Members' : 'Admins'}
                </Button>
              ))}
            </div>
            {/* Create test accounts button — generates N test users with
                channels for QA/demo purposes. Opens a small inline form. */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowCreateTest(!showCreateTest); setTestResult(null) }}
              className="border-violet-200 dark:border-violet-900 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 shrink-0"
              title="Generate test accounts with channels for QA"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Create test accounts
            </Button>
          </div>

          {/* Create test accounts form */}
          {showCreateTest && (
            <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Create test accounts</h3>
                <button
                  onClick={() => setShowCreateTest(false)}
                  className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400 p-1"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Generates test users with channels. Each gets the member role, a channel,
                and the password <code className="px-1 py-0.5 bg-violet-100 dark:bg-violet-900/40 rounded text-violet-700 dark:text-violet-400">testpass123</code>.
                Emails follow the pattern <code className="px-1 py-0.5 bg-violet-100 dark:bg-violet-900/40 rounded text-violet-700 dark:text-violet-400">testuser_&lt;batch&gt;_N@test.vert.com</code>.
              </p>
              <div className="flex items-center gap-3">
                <label className="text-sm text-zinc-700 dark:text-zinc-300 shrink-0">How many?</label>
                <select
                  value={testCount}
                  onChange={(e) => setTestCount(parseInt(e.target.value, 10))}
                  className="text-sm bg-white border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-600"
                >
                  {[1, 2, 3, 5, 10, 20].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <Button
                  onClick={handleCreateTestUsers}
                  disabled={creatingTest}
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white ml-auto"
                >
                  {creatingTest ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Create {testCount} account{testCount !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Test account creation result — shows generated credentials
              so the admin can copy them for testing. */}
          {testResult && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  Created {testResult.created} test account{testResult.created !== 1 ? 's' : ''}
                </h3>
                <button
                  onClick={() => setTestResult(null)}
                  className="text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 p-1"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="bg-white dark:bg-zinc-800 border border-emerald-100 dark:border-emerald-900 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
                      <th className="text-left font-medium text-zinc-600 dark:text-zinc-400 px-3 py-2">Username</th>
                      <th className="text-left font-medium text-zinc-600 dark:text-zinc-400 px-3 py-2">Email</th>
                      <th className="text-left font-medium text-zinc-600 dark:text-zinc-400 px-3 py-2">Password</th>
                      <th className="text-left font-medium text-zinc-600 dark:text-zinc-400 px-3 py-2">Channel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResult.users.map((u) => (
                      <tr key={u.email} className="border-b border-emerald-50 dark:border-emerald-900/50 last:border-0">
                        <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100 font-medium">{u.username}</td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{u.email}</td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400 font-mono">{u.password}</td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{u.channelName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">{testResult.note}</p>
            </div>
          )}

          {/* Error */}
          {userError && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
              {userError}
            </div>
          )}

          {/* Loading */}
          {usersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : adminUsers.length === 0 ? (
            <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <Users className="h-10 w-10 text-zinc-400 dark:text-zinc-500 mx-auto mb-3" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">No users found</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                {userSearch ? `No matches for "${userSearch}"` : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              {/* table-fixed + explicit col widths so the Actions column is
                  always visible without horizontal scrolling. Previously
                  the table was 3205px wide in a 974px container, and the
                  Actions column (last of 7) was scrolled off-screen — admins
                  couldn't see the suspend/promote/delete buttons. Dropped the
                  avatar and the Comments column to save space. */}
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[26%]" />
                    <col className="w-[9%]" />
                    <col className="w-[10%]" />
                    <col className="w-[9%]" />
                    <col className="w-[7%]" />
                    <col className="w-[11%]" />
                    <col className="w-[28%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-white">
                      <th className="text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 px-4 py-3">User</th>
                      <th className="text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 px-4 py-3">Role</th>
                      <th className="text-center text-xs font-medium text-zinc-700 dark:text-zinc-300 px-2 py-3">Online</th>
                      <th className="text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 px-3 py-3">Account</th>
                      <th className="text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 px-3 py-3">Videos</th>
                      <th className="text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 px-3 py-3">Joined</th>
                      <th className="text-right text-xs font-medium text-zinc-700 dark:text-zinc-300 px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u) => (
                      <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        {/* User cell — no avatar, just username + email
                            (avatar was taking 40px+ that made the table
                            too wide). Email truncates with ellipsis. */}
                        <td className="px-4 py-3 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{u.username}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{u.email}</p>
                          {u.oauthProvider && (
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">via {u.oauthProvider}</p>
                          )}
                        </td>
                        {/* Role */}
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={u.role === 'admin'
                              ? 'border-violet-200 dark:border-violet-900 text-violet-700 dark:text-violet-400 text-xs'
                              : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs'}
                          >
                            {u.role}
                          </Badge>
                        </td>
                        {/* Online — green dot if lastSeenAt is within 5 min,
                            gray dot otherwise. Tooltip shows last-seen time. */}
                        <td className="px-2 py-3 text-center">
                          {(() => {
                            const isOnline = u.lastSeenAt && (Date.now() - new Date(u.lastSeenAt).getTime()) < 5 * 60 * 1000
                            const title = u.lastSeenAt
                              ? `Last seen ${timeAgo(u.lastSeenAt)}`
                              : 'Never seen'
                            return (
                              <span
                                title={title}
                                className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                              />
                            )
                          })()}
                        </td>
                        {/* Account — active/suspended state (renamed from
                            "Status" which was ambiguous — users thought
                            "active" meant "online right now"). */}
                        <td className="px-3 py-3">
                          {u.isActive ? (
                            <Badge variant="outline" className="border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                              active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1" />
                              suspended
                            </Badge>
                          )}
                          {u.channel?.isSuspended && (
                            <Badge variant="outline" className="border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-400 text-xs ml-1">
                              channel suspended
                            </Badge>
                          )}
                        </td>
                        {/* Video count */}
                        <td className="text-right px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                          {u.videoCount}
                        </td>
                        {/* Joined */}
                        <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {timeAgo(u.createdAt)}
                        </td>
                        {/* Actions — always visible now that the table fits. */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* Role toggle */}
                            <button
                              onClick={() => updateUserRole(u.id, u.role === 'admin' ? 'member' : 'admin')}
                              disabled={userActionId === u.id}
                              title={u.role === 'admin' ? 'Demote to member' : 'Promote to admin'}
                              className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                                u.role === 'admin'
                                  ? 'text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30'
                                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-violet-600'
                              }`}
                            >
                              {userActionId === u.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <UserCog className="h-3.5 w-3.5" />
                              )}
                            </button>
                            {/* Activate/deactivate toggle */}
                            <button
                              onClick={() => toggleUserActive(u.id, u.isActive)}
                              disabled={userActionId === u.id}
                              title={u.isActive ? 'Suspend user' : 'Reactivate user'}
                              className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                                u.isActive
                                  ? 'text-zinc-500 dark:text-zinc-400 hover:bg-orange-100 hover:text-orange-600'
                                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                              }`}
                            >
                              {u.isActive ? (
                                <UserX className="h-3.5 w-3.5" />
                              ) : (
                                <UserCheck className="h-3.5 w-3.5" />
                              )}
                            </button>
                            {/* Delete (hard) */}
                            <button
                              onClick={() => deleteUser(u.id, u.username)}
                              disabled={userActionId === u.id}
                              title="Permanently delete user"
                              className="p-1.5 rounded text-zinc-500 dark:text-zinc-400 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Footer with count + legend */}
              <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>{adminUsers.length} user{adminUsers.length !== 1 ? 's' : ''} shown · <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 align-middle" /> online = active in last 5 min</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <UserCog className="h-3 w-3" /> toggle role
                  </span>
                  <span className="flex items-center gap-1">
                    <UserX className="h-3 w-3" /> suspend
                  </span>
                  <span className="flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> delete
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
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
    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
        {value > 999 ? formatViews(value) : value.toLocaleString()}
      </p>
      <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1">{label}</p>
    </div>
  )
}
