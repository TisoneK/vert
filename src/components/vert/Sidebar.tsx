'use client'

import { useNavigation, useAuth } from '@/lib/store'
import { useState, useEffect, useRef, type ElementType } from 'react'
import {
  Home,
  Flame,
  Clock,
  Bookmark,
  Compass,
  Shield,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Music,
  Trophy,
  Gamepad2,
  Film,
  Newspaper,
  Monitor,
  Cpu,
  Mail,
  ListVideo,
  ScrollText,
  X,
} from 'lucide-react'

interface SidebarCategory {
  id: string
  name: string
  slug: string
}

interface SidebarChannel {
  id: string
  channelName: string
  user: { avatarUrl: string | null }
}

const categoryIconMap: Record<string, ElementType> = {
  music: Music,
  sports: Trophy,
  gaming: Gamepad2,
  entertainment: Film,
  news: Newspaper,
  tech: Cpu,
  education: Monitor,
  comedy: Film,
  travel: Compass,
  food: Film,
  fitness: Trophy,
  art: Film,
  other: Film,
}

interface SidebarProps {
  collapsed: boolean
  onClose: () => void
}

export function Sidebar({ collapsed, onClose }: SidebarProps) {
  const { navigate, currentView } = useNavigation()
  const { user } = useAuth()
  const [categories, setCategories] = useState<SidebarCategory[]>([])
  const [channels, setChannels] = useState<SidebarChannel[]>([])
  const [categoriesExpanded, setCategoriesExpanded] = useState(true)
  const [channelsExpanded, setChannelsExpanded] = useState(true)
  const drawerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (collapsed) return

    const closeOnMobileResize = () => {
      if (window.matchMedia('(max-width: 767px)').matches) onClose()
    }
    window.addEventListener('resize', closeOnMobileResize)

    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    firstFocusable?.focus()
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !drawerRef.current) return
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', trapFocus)
    return () => {
      window.removeEventListener('resize', closeOnMobileResize)
      document.removeEventListener('keydown', trapFocus)
    }
  }, [collapsed, onClose])

  useEffect(() => {
    if (collapsed) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [collapsed, onClose])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/v1/categories')
        if (res.ok && !cancelled) {
          const data = await res.json()
          setCategories(data.categories.slice(0, 6))
        }
      } catch { /* ignore */ }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadChannels() {
      try {
        const res = await fetch('/api/v1/trending?limit=5')
        if (res.ok && !cancelled) {
          const data = await res.json()
          const uniqueChannels = data.videos
            .map((v: { channel: SidebarChannel }) => v.channel)
            .filter((ch: SidebarChannel, i: number, arr: SidebarChannel[]) =>
              arr.findIndex((c: SidebarChannel) => c.id === ch.id) === i
            )
            .slice(0, 5)
          setChannels(uniqueChannels)
        }
      } catch { /* ignore */ }
    }
    loadChannels()
    return () => { cancelled = true }
  }, [])

  if (collapsed) return null

  const isActive = (page: string) => currentView.page === page
  const mainNavItems = [
    { icon: Home, label: 'Home', action: () => navigate({ page: 'home' }), active: isActive('home') },
    { icon: Compass, label: 'Explore', action: () => navigate({ page: 'explore' }), active: isActive('explore') },
    { icon: Flame, label: 'Trending', action: () => navigate({ page: 'trending' }), active: isActive('trending') },
  ]
  const personalNavItems = user ? [
    { icon: Clock, label: 'History', action: () => navigate({ page: 'history' }), active: isActive('history') },
    { icon: Bookmark, label: 'Saved', action: () => navigate({ page: 'saved' }), active: isActive('saved') },
    { icon: ListVideo, label: 'Playlists', action: () => navigate({ page: 'playlists' }), active: isActive('playlists') || isActive('playlist') },
  ] : []
  const footerItems = [
    { icon: ScrollText, label: 'Changelog', action: () => navigate({ page: 'changelog' }), active: isActive('changelog') },
    { icon: Mail, label: 'Contact Us', action: () => navigate({ page: 'contact' }), active: isActive('contact') },
  ]

  const navButton = (item: { icon: ElementType; label: string; action: () => void; active: boolean }) => {
    const Icon = item.icon
    return (
      <button
        key={item.label}
        onClick={() => { item.action(); onClose() }}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 ${
          item.active
            ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-semibold'
            : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </button>
    )
  }

  return (
    <>
      <div
        className="hidden md:block fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-[1px] animate-overlay-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
        className="hidden md:flex fixed left-0 top-14 bottom-0 z-50 w-64 flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-700 py-3 px-2 overflow-y-auto custom-scrollbar shadow-2xl animate-drawer-in"
      >
        <div className="flex items-center justify-between px-3 pb-2 mb-1 border-b border-zinc-200 dark:border-zinc-700">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Menu</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5">
          {mainNavItems.map(navButton)}
        </nav>

        {personalNavItems.length > 0 && (
          <>
            <div className="my-2 border-t border-zinc-200 dark:border-zinc-700" />
            <nav className="flex flex-col gap-0.5">{personalNavItems.map(navButton)}</nav>
          </>
        )}

        {channels.length > 0 && (
          <>
            <div className="my-2 border-t border-zinc-200 dark:border-zinc-700" />
            <section>
              <button
                onClick={() => setChannelsExpanded(!channelsExpanded)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                aria-expanded={channelsExpanded}
              >
                Popular Channels
                {channelsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {channelsExpanded && (
                <div className="flex flex-col gap-0.5 mt-1">
                  {channels.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => { navigate({ page: 'channel', channelId: ch.id }); onClose() }}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {ch.user.avatarUrl ? (
                        <img src={ch.user.avatarUrl} alt={ch.channelName} loading="lazy" decoding="async" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 text-[9px] font-bold">{ch.channelName[0]?.toUpperCase()}</div>
                      )}
                      <span className="truncate">{ch.channelName}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {categories.length > 0 && (
          <>
            <div className="my-2 border-t border-zinc-200 dark:border-zinc-700" />
            <section>
              <button
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                aria-expanded={categoriesExpanded}
              >
                Categories
                {categoriesExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {categoriesExpanded && (
                <div className="flex flex-col gap-0.5 mt-1">
                  {categories.map((cat) => {
                    const Icon = categoryIconMap[cat.slug] || Film
                    return (
                      <button
                        key={cat.id}
                        onClick={() => { navigate({ page: 'category', slug: cat.slug }); onClose() }}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${
                          currentView.page === 'category' && (currentView as { slug: string }).slug === cat.slug
                            ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-semibold'
                            : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{cat.name}</span>
                      </button>
                    )
                  })}
                  <button
                    onClick={() => { navigate({ page: 'explore' }); onClose() }}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                  >
                    <ChevronLeft className="h-3 w-3" /> All Categories
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {user && (user.channelId || user.role === 'admin') && (
          <>
            <div className="my-3 border-t border-zinc-200 dark:border-zinc-700" />
            <p className="px-3 mb-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Creator</p>
            <div className="flex flex-col gap-0.5">
              {user.channelId && navButton({ icon: BarChart3, label: 'Creator Studio', action: () => navigate({ page: 'creator-studio' }), active: isActive('creator-studio') })}
              {user.role === 'admin' && navButton({ icon: Shield, label: 'Admin Panel', action: () => navigate({ page: 'admin' }), active: isActive('admin') })}
            </div>
          </>
        )}

        <div className="mt-auto pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex flex-col gap-0.5">{footerItems.map(navButton)}</div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 px-3 mt-2">Vert v1.0</p>
        </div>
      </aside>
    </>
  )
}
