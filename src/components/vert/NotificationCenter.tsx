'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/v1/notifications?limit=50', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch {
      // Silent failure — UI will just show empty state
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load on mount + when user changes + light polling every 60s while mounted
  useEffect(() => {
    fetchNotifications()
    if (!user) return
    const id = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(id)
  }, [fetchNotifications, user])

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
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' })
    } catch {
      // Revert on failure
      fetchNotifications()
    }
  }

  const markAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return
    setMarkingAll(true)
    const prevCount = unreadCount
    // Optimistic
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
    try {
      await fetch('/api/v1/notifications/read-all', { method: 'POST' })
    } catch {
      setUnreadCount(prevCount)
      fetchNotifications()
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors relative"
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
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-zinc-200 shadow-lg rounded-lg z-50">
          <div className="flex items-center justify-between p-3 border-b border-zinc-200">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full">
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
                  className="text-zinc-600 hover:text-violet-600 p-1 rounded hover:bg-zinc-100 transition-colors disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-zinc-900 p-1 rounded hover:bg-zinc-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-6 text-center text-zinc-400 text-sm">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-sm">
                {user ? 'No notifications yet' : 'Sign in to see notifications'}
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    if (!notification.isRead) markAsRead(notification.id)
                  }}
                  className={`w-full text-left p-3 hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0 ${
                    !notification.isRead ? 'bg-violet-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notification.isRead && (
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-900">{notification.title}</p>
                      <p className="text-[11px] text-zinc-600 mt-0.5 break-words">{notification.message}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">{formatRelative(notification.createdAt)}</p>
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
