'use client'

import { useState } from 'react'
import { MoreVertical, Bookmark, Share2, EyeOff, Flag } from 'lucide-react'

interface VideoContextMenuProps {
  videoId: string
  onAction?: (action: string, videoId: string) => void
  children?: React.ReactNode
}

export function VideoContextMenu({ videoId, onAction }: VideoContextMenuProps) {
  const [open, setOpen] = useState(false)

  const menuItems = [
    { icon: Bookmark, label: 'Save to Watch Later', action: 'save' },
    { icon: Share2, label: 'Share', action: 'share' },
    { icon: EyeOff, label: 'Not interested', action: 'not-interested' },
    { icon: Flag, label: 'Report', action: 'report', danger: true },
  ]

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className="p-1 bg-white/80 dark:bg-zinc-800/80 rounded text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow-sm"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false) }} />
          <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl py-1 z-50">
            {menuItems.map((item) => (
              <button
                key={item.action}
                onClick={(e) => {
                  e.stopPropagation()
                  onAction?.(item.action, videoId)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                  item.danger ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
