'use client'

import { useNavigation, useAuth } from '@/lib/store'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'
import {
  Search,
  Upload,
  LogOut,
  User,
  Shield,
  Menu,
  Settings as SettingsIcon,
  Settings2,
  ChevronDown,
  X,
  Moon,
  Sun,
} from 'lucide-react'
import { NotificationCenter } from './NotificationCenter'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onLogout: () => void
  onToggleSidebar: () => void
  onToggleMobileDrawer: () => void
}

export function Header({ onLogout, onToggleSidebar, onToggleMobileDrawer }: HeaderProps) {
  const { navigate } = useNavigation()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate({ page: 'search', query: searchQuery.trim() })
      setSearchQuery('')
      setShowMobileSearch(false)
    }
  }

  return (
    <header className="shrink-0 z-50 h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center justify-between h-full px-4 gap-3">
        {/* Left: Burger + Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleMobileDrawer}
            className="md:hidden p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            onClick={onToggleSidebar}
            className="hidden md:block p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate({ page: 'home' })}
            className="flex items-center gap-1.5"
          >
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Vert</span>
          </button>
        </div>

        {/* Center: Search bar (desktop) */}
        <div className="hidden md:flex flex-1 max-w-lg mx-4 relative">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos, creators, tags…"
                className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-base md:text-sm text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-600 transition-colors"
              />
            </div>
          </form>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Mobile search toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Sun className="h-5 w-5 hidden dark:block" />
            <Moon className="h-5 w-5 block dark:hidden" />
          </button>

          {user && (
            <>
              <button
                onClick={() => navigate({ page: 'upload' })}
                className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1"
                aria-label="Upload video"
              >
                <Upload className="h-5 w-5" />
              </button>

              {/* Notification bell */}
              <NotificationCenter />
            </>
          )}

          {/* Profile / Auth */}
          {user ? (
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1"
              >
                <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 text-xs font-bold">
                  {user.username[0]?.toUpperCase()}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 hidden sm:block" />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg dark:shadow-zinc-900/50 rounded-lg py-1 z-50">
                  <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.username}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { navigate({ page: 'profile' }); setShowProfileMenu(false) }}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors"
                  >
                    <User className="h-4 w-4" /> My Channel
                  </button>
                  {user.channelId && (
                    <button
                      onClick={() => { navigate({ page: 'creator-studio' }); setShowProfileMenu(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors"
                    >
                      <Settings2 className="h-4 w-4" /> Creator Studio
                    </button>
                  )}
                  <button
                    onClick={() => { navigate({ page: 'settings' }); setShowProfileMenu(false) }}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors"
                  >
                    <SettingsIcon className="h-4 w-4" /> Settings
                  </button>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => { navigate({ page: 'admin' }); setShowProfileMenu(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors"
                    >
                      <Shield className="h-4 w-4" /> Admin Panel
                    </button>
                  )}
                  <div className="border-t border-zinc-200 dark:border-zinc-700 mt-1 pt-1">
                    <button
                      onClick={() => { onLogout(); setShowProfileMenu(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ page: 'login' })}
                className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Log In
              </Button>
              <Button
                size="sm"
                onClick={() => navigate({ page: 'signup' })}
                className="bg-violet-600 hover:bg-violet-700 text-white font-medium active:scale-95 transition-transform"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search overlay */}
      {showMobileSearch && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos, creators, tags…"
                className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-base md:text-sm text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-600"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => setShowMobileSearch(false)}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <X className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}
    </header>
  )
}
