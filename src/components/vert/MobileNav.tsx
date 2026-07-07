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
          {/* pt-[env(safe-area-inset-top)] + pb-[env(safe-area-inset-bottom)]
              so the drawer content doesn't get clipped by the notch / home
              indicator on iPhone X+ devices. */}
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-700 animate-drawer-in overflow-y-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Vert</span>
              </div>
              <button
                onClick={() => onDrawerOpenChange(false)}
                className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-3 space-y-0.5">
              <button
                onClick={() => { navigate({ page: 'home' }); onDrawerOpenChange(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive('home') ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-l-2 border-violet-600' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Home className="h-4 w-4" /> Home
              </button>
              <button
                onClick={() => { navigate({ page: 'explore' }); onDrawerOpenChange(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive('explore') ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-l-2 border-violet-600' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Compass className="h-4 w-4" /> Explore
              </button>
              <button
                onClick={() => { navigate({ page: 'trending' }); onDrawerOpenChange(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive('trending') ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-l-2 border-violet-600' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Flame className="h-4 w-4" /> Trending
              </button>
              {user && (
                <>
                  <div className="my-2 border-t border-zinc-200 dark:border-zinc-700" />
                  <button
                    onClick={() => { navigate({ page: 'history' }); onDrawerOpenChange(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive('history') ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-l-2 border-violet-600' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Clock className="h-4 w-4" /> History
                  </button>
                  <button
                    onClick={() => { navigate({ page: 'saved' }); onDrawerOpenChange(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive('saved') ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-l-2 border-violet-600' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Bookmark className="h-4 w-4" /> Saved
                  </button>
                  <button
                    onClick={() => { navigate({ page: 'playlists' }); onDrawerOpenChange(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive('playlists') || isActive('playlist') ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-l-2 border-violet-600' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <ListVideo className="h-4 w-4" /> Playlists
                  </button>
                  <button
                    onClick={() => { navigate({ page: 'upload' }); onDrawerOpenChange(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                  >
                    <Upload className="h-4 w-4" /> Upload
                  </button>
                </>
              )}
              <div className="my-2 border-t border-zinc-200 dark:border-zinc-700" />
              <button
                onClick={() => { navigate({ page: 'changelog' }); onDrawerOpenChange(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive('changelog') ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-l-2 border-violet-600' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <ScrollText className="h-4 w-4" /> Changelog
              </button>
              <button
                onClick={() => { navigate({ page: 'contact' }); onDrawerOpenChange(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive('contact') ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-l-2 border-violet-600' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Mail className="h-4 w-4" /> Contact Us
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Mobile bottom bar — uses safe-area-inset-bottom so the bar
          doesn't get clipped by the iOS home indicator on notched phones.
          pb-[env(safe-area-inset-bottom)] adds the OS-reported safe area
          on top of the h-12 base height. */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-700 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-12 px-2">
          <button
            onClick={() => navigate({ page: 'home' })}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
              isActive('home') ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-600 dark:text-zinc-400'
            }`}
            aria-label="Home"
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px]">Home</span>
          </button>
          <button
            onClick={() => navigate({ page: 'explore' })}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
              isActive('explore') ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-600 dark:text-zinc-400'
            }`}
            aria-label="Explore"
          >
            <Compass className="h-5 w-5" />
            <span className="text-[10px]">Explore</span>
          </button>
          {user && (
            <button
              onClick={() => navigate({ page: 'upload' })}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
              aria-label="Upload video"
            >
              <div className="w-9 h-7 rounded-md bg-violet-600 flex items-center justify-center active:scale-95 transition-transform">
                <Upload className="h-4 w-4 text-white" />
              </div>
            </button>
          )}
          <button
            onClick={() => navigate({ page: 'trending' })}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
              isActive('trending') ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-600 dark:text-zinc-400'
            }`}
            aria-label="Trending"
          >
            <Flame className="h-5 w-5" />
            <span className="text-[10px]">Trending</span>
          </button>
          <button
            onClick={() => onDrawerOpenChange(true)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
              isActive('profile') || isActive('history') || isActive('saved') || isActive('playlists') || isActive('settings') || isActive('creator-studio') || isActive('admin') || isActive('login') || isActive('contact') ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-600 dark:text-zinc-400'
            }`}
            aria-label="More"
          >
            <User className="h-5 w-5" />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </nav>
    </>
  )
}
