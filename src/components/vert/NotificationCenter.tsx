'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, X, Check } from 'lucide-react'
import { useAuth } from '@/lib/store'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  relatedVideoId?: string | null
  relatedChannelId?: string | null
}

interface NotificationsData {
  notifications: Notification[]
  unreadCount: number
}

async function fetchNotifications(): Promise<NotificationsData> {
  const res = await fetch('/api/v1/notifications?limit=50', { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.status}`)
  const data = await res.json()
  return { notifications: data.notifications ?? [], unreadCount: data.unreadCount ?? 0 }
}

function formatRelative(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffSec = Math.max(0, Math.floor((now - then) / 1000))
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  // Absolute date for older items
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function NotificationCenter() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const notifKey = ['notifications', user?.id] as const
  const [open, setOpen] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // react-query replaces the manual fetch + 60s setInterval polling with a
  // refetchInterval. With no user the query stays idle (empty data), matching
  // the old early-return behavior.
  const { data, isLoading: loading } = useQuery({
    queryKey: notifKey,
    queryFn: fetchNotifications,
    enabled: !!user,
    refetchInterval: 60_000,
  })
  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const markAsRead = async (id: string) => {
    // Optimistic update straight into the query cache
    queryClient.setQueryData<NotificationsData>(notifKey, (prev) =>
      prev
        ? {
            notifications: prev.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
            unreadCount: Math.max(0, prev.unreadCount - 1),
          }
        : prev
    )
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' })
    } catch {
      // Revert on failure by refetching
      queryClient.invalidateQueries({ queryKey: notifKey })
    }
  }

  const markAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return
    setMarkingAll(true)
    // Optimistic
    queryClient.setQueryData<NotificationsData>(notifKey, (prev) =>
      prev ? { notifications: prev.notifications.map((n) => ({ ...n, isRead: true })), unreadCount: 0 } : prev
    )
    try {
      await fetch('/api/v1/notifications/read-all', { method: 'POST' })
    } catch {
      queryClient.invalidateQueries({ queryKey: notifKey })
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors relative"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        // w-80 (320px) is too wide for a 360px viewport when combined with
        // the bell button's right offset. Use max-w-[calc(100vw-1rem)] so
        // the dropdown never overflows the viewport, and position it so the
        // right edge aligns with the bell button's right edge.
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1rem)] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg rounded-lg z-50">
          <div className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={markingAll}
                  title="Mark all as read"
                  aria-label="Mark all as read"
                  className="text-zinc-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-6 text-center text-zinc-400 dark:text-zinc-500 text-sm">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                {user ? 'No notifications yet' : 'Sign in to see notifications'}
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    if (!notification.isRead) markAsRead(notification.id)
                  }}
                  className={`w-full text-left p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0 ${
                    !notification.isRead ? 'bg-violet-50 dark:bg-violet-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notification.isRead && (
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{notification.title}</p>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 break-words">{notification.message}</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">{formatRelative(notification.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
