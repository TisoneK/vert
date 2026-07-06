'use client'

import { useNavigation, useAuth } from '@/lib/store'
import { useEffect } from 'react'
import { Home, Upload, User, Compass, Flame, Clock, Bookmark, ListVideo, ScrollText, X, Mail } from 'lucide-react'

interface MobileNavProps {
  drawerOpen: boolean
  onDrawerOpenChange: (open: boolean) => void
}

export function MobileNav({ drawerOpen, onDrawerOpenChange }: MobileNavProps) {
  const { navigate, currentView } = useNavigation()
  const { user } = useAuth()

  const isActive = (page: string) => currentView.page === page

  // Close on Escape + lock body scroll while the drawer is open.
  // Without scroll lock, swiping inside the drawer scrolls the page behind it.
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDrawerOpenChange(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [drawerOpen, onDrawerOpenChange])

  return (
    <>
      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            onClick={() => onDrawerOpenChange(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-zinc-200 animate-drawer-in overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-zinc-900">Vert</span>
              </div>
              <button
                onClick={() => onDrawerOpenChange(false)}
                className="p-1.5 text-zinc-600 hover:text-zinc-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-3 space-y-0.5">
              <button
                onClick={() => { navigate({ page: 'home' }); onDrawerOpenChange(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive('home') ? 'bg-zinc-100 text-zinc-900 border-l-2 border-violet-600' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Home className="h-4 w-4" /> Home
              </button>
              <button
                onClick={() => { navigate({ page: 'explore' }); onDrawerOpenChange(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive('explore') ? 'bg-zinc-100 text-zinc-900 border-l-2 border-violet-600' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Compass className="h-4 w-4" /> Explore
              </button>
              <button
                onClick={() => { navigate({ page: 'trending' }); onDrawerOpenChange(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive('trending') ? 'bg-zinc-100 text-zinc-900 border-l-2 border-violet-600' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Flame className="h-4 w-4" /> Trending
              </button>
              {user && (
                <>
                  <div className="my-2 border-t border-zinc-200" />
                  <button
                    onClick={() => { navigate({ page: 'history' }); onDrawerOpenChange(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive('history') ? 'bg-zinc-100 text-zinc-900 border-l-2 border-violet-600' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    <Clock className="h-4 w-4" /> History
                  </button>
                  <button
                    onClick={() => { navigate({ page: 'saved' }); onDrawerOpenChange(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive('saved') ? 'bg-zinc-100 text-zinc-900 border-l-2 border-violet-600' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    <Bookmark className="h-4 w-4" /> Saved
                  </button>
                  <button
                    onClick={() => { navigate({ page: 'playlists' }); onDrawerOpenChange(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive('playlists') || isActive('playlist') ? 'bg-zinc-100 text-zinc-900 border-l-2 border-violet-600' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    <ListVideo className="h-4 w-4" /> Playlists
                  </button>
                  <button
                    onClick={() => { navigate({ page: 'upload' }); onDrawerOpenChange(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50 transition-colors"
                  >
                    <Upload className="h-4 w-4" /> Upload
                  </button>
                </>
              )}
              <div className="my-2 border-t border-zinc-200" />
              <button
                onClick={() => { navigate({ page: 'changelog' }); onDrawerOpenChange(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive('changelog') ? 'bg-zinc-100 text-zinc-900 border-l-2 border-violet-600' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <ScrollText className="h-4 w-4" /> Changelog
              </button>
              <button
                onClick={() => { navigate({ page: 'contact' }); onDrawerOpenChange(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive('contact') ? 'bg-zinc-100 text-zinc-900 border-l-2 border-violet-600' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Mail className="h-4 w-4" /> Contact Us
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200">
        <div className="flex items-center justify-around h-12 px-2">
          <button
            onClick={() => navigate({ page: 'home' })}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
              isActive('home') ? 'text-zinc-900' : 'text-zinc-600'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px]">Home</span>
          </button>
          <button
            onClick={() => navigate({ page: 'explore' })}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
              isActive('explore') ? 'text-zinc-900' : 'text-zinc-600'
            }`}
          >
            <Compass className="h-5 w-5" />
            <span className="text-[10px]">Explore</span>
          </button>
          {user && (
            <button
              onClick={() => navigate({ page: 'upload' })}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
            >
              <div className="w-9 h-7 rounded-md bg-violet-600 flex items-center justify-center">
                <Upload className="h-4 w-4 text-white" />
              </div>
            </button>
          )}
          <button
            onClick={() => navigate({ page: 'trending' })}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
              isActive('trending') ? 'text-zinc-900' : 'text-zinc-600'
            }`}
          >
            <Flame className="h-5 w-5" />
            <span className="text-[10px]">Trending</span>
          </button>
          <button
            onClick={() => onDrawerOpenChange(true)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
              isActive('profile') || isActive('login') || isActive('contact') ? 'text-zinc-900' : 'text-zinc-600'
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </nav>
    </>
  )
}
