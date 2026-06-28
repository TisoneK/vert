'use client'

import { useNavigation, useAuth, pathToView } from '@/lib/store'
import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { HomeFeed } from './HomeFeed'
import { VideoDetail } from './VideoDetail'
import { ChannelPage } from './ChannelPage'
import { UploadPage } from './UploadPage'
import { SearchResults } from './SearchResults'
import { AdminDashboard } from './AdminDashboard'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'
import { ProfilePage } from './ProfilePage'
import { MobileNav } from './MobileNav'
import { TrendingPage } from './TrendingPage'
import { ExplorePage } from './ExplorePage'
import { CategoryPage } from './CategoryPage'
import { TagPage } from './TagPage'
import { HistoryPage } from './HistoryPage'
import { SavedPage } from './SavedPage'
import { CreatorStudio } from './CreatorStudio'
import { ContactPage } from './ContactPage'

export function VertApp() {
  const { currentView, navigate } = useNavigation()
  const { setUser, isLoading, user } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Fetch session on mount
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/session-info')
        const data = await res.json()
        setUser(data.user)
      } catch {
        setUser(null)
      }
    }
    fetchSession()
  }, [setUser])

  // Sync Zustand navigation store with the browser URL.
  //
  // On mount: parse window.location and navigate to it (without pushing a
  // duplicate history entry). This is what makes deep links work — when a
  // user lands on /watch/<id> directly, VertApp renders the right view.
  //
  // On popstate (back/forward button): re-parse and navigate.
  useEffect(() => {
    function syncFromUrl() {
      const next = pathToView(window.location.pathname)
      if (next) {
        // Special case: /search?q=... reads the query string
        if (next.page === 'search') {
          const q = new URLSearchParams(window.location.search).get('q') || ''
          navigate({ page: 'search', query: q }, { skipHistoryPush: true })
        } else {
          navigate(next, { skipHistoryPush: true })
        }
      }
    }

    // Initial sync on mount
    syncFromUrl()

    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [navigate])

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false })
    } catch {
      // ignore
    }
    setUser(null)
    useNavigation.getState().navigate({ page: 'home' })
  }

  if (isLoading) {
    return (
      <div className="h-screen overflow-hidden bg-white text-zinc-900 flex flex-col">
        {/* Skeleton header */}
        <header className="shrink-0 h-14 bg-white border-b border-zinc-200 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-zinc-200 animate-pulse" />
            <div className="w-12 h-5 rounded bg-zinc-200 animate-pulse hidden sm:block" />
          </div>
          <div className="w-48 h-8 rounded-full bg-zinc-200 animate-pulse hidden md:block" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-200 animate-pulse" />
            <div className="w-8 h-8 rounded-lg bg-zinc-200 animate-pulse" />
            <div className="w-7 h-7 rounded-full bg-zinc-200 animate-pulse" />
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          {/* Skeleton sidebar */}
          <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-zinc-200 py-3 px-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-zinc-100 animate-pulse" />
            ))}
            <div className="my-2 border-t border-zinc-200" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-zinc-100 animate-pulse" />
            ))}
          </aside>
          {/* Skeleton content */}
          <main className="flex-1 p-4 md:p-6">
            <div className="flex gap-2 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-20 h-8 rounded-lg bg-zinc-200 animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video rounded-lg bg-zinc-200" />
                  <div className="mt-2 h-3.5 w-3/4 rounded bg-zinc-200" />
                  <div className="mt-1.5 h-3 w-1/2 rounded bg-zinc-200" />
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (currentView.page) {
      case 'home':
        return <HomeFeed />
      case 'video':
        return <VideoDetail videoId={currentView.videoId} />
      case 'channel':
        return <ChannelPage channelId={currentView.channelId} />
      case 'upload':
        return user ? <UploadPage /> : <LoginForm />
      case 'search':
        return <SearchResults query={currentView.query} />
      case 'admin':
        return user?.role === 'admin' ? <AdminDashboard /> : <HomeFeed />
      case 'profile':
        return user ? <ProfilePage /> : <LoginForm />
      case 'login':
        return <LoginForm />
      case 'signup':
        return <SignupForm />
      case 'trending':
        return <TrendingPage />
      case 'category':
        return <CategoryPage slug={currentView.slug} />
      case 'tag':
        return <TagPage slug={currentView.slug} />
      case 'explore':
        return <ExplorePage />
      case 'history':
        return <HistoryPage />
      case 'saved':
        return <SavedPage />
      case 'creator-studio':
        return user ? <CreatorStudio /> : <LoginForm />
      case 'contact':
        return <ContactPage />
      case 'playlists':
        return user ? <ProfilePage /> : <LoginForm />
      default:
        return <HomeFeed />
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-white text-zinc-900 flex flex-col">
      <Header onLogout={handleLogout} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} onToggleMobileDrawer={() => setMobileDrawerOpen(!mobileDrawerOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {renderView()}
        </main>
      </div>
      <MobileNav drawerOpen={mobileDrawerOpen} onDrawerOpenChange={setMobileDrawerOpen} />
    </div>
  )
}
