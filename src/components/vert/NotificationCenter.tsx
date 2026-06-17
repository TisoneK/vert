'use client'

import { useState, useRef } from 'react'
import { Bell, X } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
}

// Demo notifications
const demoNotifications: Notification[] = [
  { id: '1', title: 'New subscriber', message: 'JohnDoe subscribed to your channel', time: '2m ago', read: false },
  { id: '2', title: 'Video liked', message: 'Your video "Morning Routine" received 10 likes', time: '1h ago', read: false },
  { id: '3', title: 'New comment', message: 'JaneSmith commented on your video', time: '3h ago', read: true },
]

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unreadCount = demoNotifications.filter(n => !n.read).length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors relative"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-zinc-200 shadow-lg rounded-lg z-50">
          <div className="flex items-center justify-between p-3 border-b border-zinc-200">
            <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
            <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-zinc-900">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            {demoNotifications.length === 0 ? (
              <div className="p-6 text-center text-zinc-700 text-sm">No notifications</div>
            ) : (
              demoNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-zinc-100 transition-colors border-b border-zinc-100 last:border-0 ${
                    !notification.read ? 'bg-violet-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notification.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-700">{notification.title}</p>
                      <p className="text-[11px] text-zinc-700 mt-0.5">{notification.message}</p>
                      <p className="text-[10px] text-zinc-700 mt-1">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
