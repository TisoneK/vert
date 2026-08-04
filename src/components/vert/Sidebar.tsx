'use client'

import { useNavigation, useAuth } from '@/lib/store'
import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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

const categoryIconMap: Record<string, React.ElementType> = {
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
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { navigate, currentView } = useNavigation()
  const { user } = useAuth()
  const [categories, setCategories] = useState<SidebarCategory[]>([])
  const [channels, setChannels] = useState<SidebarChannel[]>([])
  // Default both sections to expanded so users actually see the content.
  // Collapsed sections look like empty space and users miss the links.
  const [categoriesExpanded, setCategoriesExpanded] = useState(true)
  const [channelsExpanded, setChannelsExpanded] = useState(true)

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
    async function loadChannels() {
      try {
        const res = await fetch('/api/v1/trending?limit=5')
        if (res.ok) {
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
  }, [])

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
    { icon: ScrollText, label: 'Changelog', action: () => navigate({ page: 'changelog' }), active: currentView.page === 'changelog' },
    { icon: Mail, label: 'Contact Us', action: () => navigate({ page: 'contact' }), active: currentView.page === 'contact' },
  ]

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <aside className="hidden md:flex flex-col w-16 shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-700 py-3 px-1.5 items-center gap-1 sidebar-transition overflow-y-auto custom-scrollbar">
          {mainNavItems.map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <button
                  onClick={item.action}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 ${
                    item.active
                      ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                      : 'text-zinc-800 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
            </Tooltip>
          ))}

          <div className="w-8 border-t border-zinc-200 dark:border-zinc-700 my-1" />

          {personalNavItems.map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <button
                  onClick={item.action}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 ${
                    item.active
                      ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                      : 'text-zinc-800 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
            </Tooltip>
          ))}

          <div className="mt-auto" />
          {footerItems.map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <button
                  onClick={item.action}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1"
                >
                  <item.icon className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </aside>
      </TooltipProvider>
    )
  }

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-700 py-3 px-2 overflow-y-auto custom-scrollbar sidebar-transition">
      {/* Main navigation */}
      <nav className="flex flex-col gap-0.5">
        {mainNavItems.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 ${
              item.active
                ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Personal section */}
      {personalNavItems.length > 0 && (
        <>
          <div className="my-2 border-t border-zinc-200 dark:border-zinc-700" />
          <nav className="flex flex-col gap-0.5">
            {personalNavItems.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 ${
                  item.active
                    ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </>
      )}

      {/* Popular channels section */}
      {channels.length > 0 && (
        <>
          <div className="my-2 border-t border-zinc-200 dark:border-zinc-700" />
          <div>
            <button
              onClick={() => setChannelsExpanded(!channelsExpanded)}
              className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 text-zinc-800 dark:text-zinc-200 uppercase tracking-wider"
            >
              Popular Channels
              {channelsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {channelsExpanded && (
              <div className="flex flex-col gap-0.5 mt-1">
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => navigate({ page: 'channel', channelId: ch.id })}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 ${
                      currentView.page === 'channel' && (currentView as { channelId: string }).channelId === ch.id
                        ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-semibold'
                        : 'text-zinc-800 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {ch.user.avatarUrl ? (
                      <img src={ch.user.avatarUrl} alt={ch.channelName} loading="lazy" decoding="async" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 text-[9px] font-bold">
                        {ch.channelName[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="truncate">{ch.channelName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Categories section */}
      {categories.length > 0 && (
        <>
          <div className="my-2 border-t border-zinc-200 dark:border-zinc-700" />
          <div>
            <button
              onClick={() => setCategoriesExpanded(!categoriesExpanded)}
              className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 text-zinc-800 dark:text-zinc-200 uppercase tracking-wider"
            >
              Categories
              {categoriesExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {categoriesExpanded && (
              <div className="flex flex-col gap-0.5 mt-1">
                {categories.map((cat) => {
                  const Icon = categoryIconMap[cat.slug]
                  return (
                    <button
                      key={cat.id}
                      onClick={() => navigate({ page: 'category', slug: cat.slug })}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 transition-colors ${
                        currentView.page === 'category' && (currentView as { slug: string }).slug === cat.slug
                          ? 'bg-violet-50 dark:bg-violet-900/30 text-zinc-900 dark:text-zinc-100'
                          : 'text-zinc-800 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : <Film className="h-4 w-4 shrink-0" />}
                      <span>{cat.name}</span>
                    </button>
                  )
                })}
                <button
                  onClick={() => navigate({ page: 'explore' })}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />
                  All Categories
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* User / Creator section — separated from consumer navigation with
          a labeled divider so the hierarchy is clear (viewer vs creator/admin). */}
      {user && (user.channelId || user.role === 'admin') && (
        <>
          <div className="my-3 border-t border-zinc-200 dark:border-zinc-700" />
          <p className="px-3 mb-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Creator</p>
          <div className="flex flex-col gap-0.5">
            {user.channelId && (
              <button
                onClick={() => navigate({ page: 'creator-studio' })}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 ${
                  currentView.page === 'creator-studio'
                    ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <BarChart3 className="h-4 w-4 shrink-0" />
                Creator Studio
              </button>
            )}
            {user.role === 'admin' && (
              <button
                onClick={() => navigate({ page: 'admin' })}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 ${
                  currentView.page === 'admin'
                    ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Shield className="h-4 w-4 shrink-0" />
                Admin Panel
              </button>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex flex-col gap-0.5">
          {footerItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 px-3 mt-2">
          Vert v1.0
        </p>
      </div>
    </aside>
  )
}
