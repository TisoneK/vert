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
import { LandingPage } from './LandingPage'

export function VertApp() {
  const { currentView, navigate } = useNavigation()
  const { setUser, isLoading, user } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Fetch session on mount — with a 3-second timeout so the app never
  // gets stuck on the loading spinner if the session endpoint is slow
  // or unresponsive (cold DB start, network issue, etc.).
  useEffect(() => {
    async function fetchSession() {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      try {
        const res = await fetch('/api/auth/session-info', {
          signal: controller.signal,
        })
        const data = await res.json()
        setUser(data.user ?? null)
      } catch {
        // Timeout, network error, or JSON parse error — treat as logged out
        setUser(null)
      } finally {
        clearTimeout(timeout)
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

  // Unauthed visitors on the home page see the landing page immediately —
  // don't block on the session check. If the user turns out to be logged in,
  // the store updates and this re-renders to the app shell.
  if (!user && currentView.page === 'home') {
    return <LandingPage />
  }

  // Login/signup for unauthed visitors render standalone — no sidebar,
  // no header, just the form centered on a soft background. This avoids
  // the distracting app shell visible behind the auth modal.
  if (!user && (currentView.page === 'login' || currentView.page === 'signup')) {
    return (
      <div className="min-h-screen bg-zinc-50">
        {currentView.page === 'login' ? <LoginForm /> : <SignupForm />}
      </div>
    )
  }

  // The contact page is another deep link that doesn't require auth.
  if (!user && currentView.page === 'contact') {
    return (
      <div className="min-h-screen bg-zinc-50">
        <header className="border-b border-zinc-100 bg-white">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
            <button
              onClick={() => navigate({ page: 'home' })}
              className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 rounded"
            >
              <span className="text-lg font-bold text-zinc-900 tracking-tight">Vert</span>
            </button>
          </div>
        </header>
        <ContactPage />
      </div>
    )
  }

  // For deep-link routes, show a minimal spinner while we check the session.
  // The 3-second timeout on the fetch (above) guarantees this never hangs.
  if (isLoading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-zinc-200 border-t-violet-600 rounded-full animate-spin" />
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
        return user?.role === 'admin' ? <AdminDashboard /> : (
          <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
            <p className="text-6xl font-bold text-zinc-900 tracking-tight">403</p>
            <p className="text-zinc-500 mt-2 text-sm">You don&apos;t have access to this page.</p>
            <button
              onClick={() => navigate({ page: 'home' })}
              className="mt-6 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Go home
            </button>
          </div>
        )
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
    <div className="h-screen overflow-hidden bg-zinc-50 text-zinc-800 flex flex-col">
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
