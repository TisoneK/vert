import { create } from 'zustand'

export type View =
  | { page: 'home' }
  | { page: 'video'; videoId: string }
  | { page: 'channel'; channelId: string }
  | { page: 'upload' }
  | { page: 'search'; query: string }
  | { page: 'admin' }
  | { page: 'profile' }
  | { page: 'login' }
  | { page: 'signup' }
  | { page: 'trending' }
  | { page: 'category'; slug: string }
  | { page: 'tag'; slug: string }
  | { page: 'explore' }
  | { page: 'history' }
  | { page: 'saved' }
  | { page: 'playlists' }
  | { page: 'playlist'; playlistId: string }
  | { page: 'creator-studio' }
  | { page: 'settings' }
  | { page: 'changelog' }
  | { page: 'contact' }

/**
 * Map a View to a URL pathname.
 *
 * Used by the `navigate()` store action to push the new view to the browser
 * history so that:
 *   - URLs are deep-linkable (a user can share `/watch/<id>` and it works)
 *   - Browser back/forward works
 *   - SEO crawlers see distinct URLs per video/channel
 *
 * All views now have real URLs — including account-state views like
 * /upload, /profile, /admin, /history, /saved, /creator-studio, /login,
 * /signup. Each has a thin Next.js route file that renders <VertApp />,
 * which then parses the URL and shows the right view. This means
 * bookmarks and shared links work for every page, not just content pages.
 */
export function viewToPath(view: View): string {
  switch (view.page) {
    case 'video':
      return `/watch/${view.videoId}`
    case 'channel':
      return `/channel/${view.channelId}`
    case 'category':
      return `/category/${view.slug}`
    case 'tag':
      return `/tag/${view.slug}`
    case 'search':
      return `/search?q=${encodeURIComponent(view.query)}`
    case 'trending':
      return '/trending'
    case 'explore':
      return '/explore'
    case 'playlists':
      return '/playlists'
    case 'playlist':
      return `/playlist/${view.playlistId}`
    case 'settings':
      return '/settings'
    case 'changelog':
      return '/changelog'
    case 'contact':
      return '/contact'
    case 'upload':
      return '/upload'
    case 'profile':
      return '/profile'
    case 'admin':
      return '/admin'
    case 'history':
      return '/history'
    case 'saved':
      return '/saved'
    case 'creator-studio':
      return '/creator-studio'
    case 'login':
      return '/login'
    case 'signup':
      return '/signup'
    case 'home':
      return '/'
    default:
      return '/'
  }
}

/**
 * Inverse of viewToPath — parse a pathname back into a View.
 * Returns `null` if the pathname doesn't correspond to a known view.
 */
export function pathToView(pathname: string): View | null {
  // Strip trailing slash (except for root)
  const path = pathname.replace(/\/$/, '') || '/'

  if (path === '/') return { page: 'home' }
  if (path === '/trending') return { page: 'trending' }
  if (path === '/explore') return { page: 'explore' }
  if (path === '/playlists') return { page: 'playlists' }
  if (path === '/settings') return { page: 'settings' }
  if (path === '/changelog') return { page: 'changelog' }
  if (path === '/contact') return { page: 'contact' }
  // Account-state views — now have real routes so bookmarks work.
  if (path === '/upload') return { page: 'upload' }
  if (path === '/profile') return { page: 'profile' }
  if (path === '/admin') return { page: 'admin' }
  if (path === '/history') return { page: 'history' }
  if (path === '/saved') return { page: 'saved' }
  if (path === '/creator-studio') return { page: 'creator-studio' }
  if (path === '/login') return { page: 'login' }
  if (path === '/signup') return { page: 'signup' }

  const watchMatch = path.match(/^\/watch\/(.+)$/)
  if (watchMatch) return { page: 'video', videoId: decodeURIComponent(watchMatch[1]) }

  const channelMatch = path.match(/^\/channel\/(.+)$/)
  if (channelMatch) return { page: 'channel', channelId: decodeURIComponent(channelMatch[1]) }

  const categoryMatch = path.match(/^\/category\/(.+)$/)
  if (categoryMatch) return { page: 'category', slug: decodeURIComponent(categoryMatch[1]) }

  const tagMatch = path.match(/^\/tag\/(.+)$/)
  if (tagMatch) return { page: 'tag', slug: decodeURIComponent(tagMatch[1]) }

  const playlistMatch = path.match(/^\/playlist\/(.+)$/)
  if (playlistMatch) return { page: 'playlist', playlistId: decodeURIComponent(playlistMatch[1]) }

  const searchMatch = path.match(/^\/search$/)
  if (searchMatch) {
    // Query string is parsed by the page component, not here
    return { page: 'search', query: '' }
  }

  return null
}

interface NavigationStore {
  currentView: View
  /**
   * Navigate to a new view.
   *
   * - If `view` maps to a deep-linkable URL (see `viewToPath`), the URL is
   *   pushed to browser history so back/forward works and the link is
   *   shareable.
   * - If `view` is an account-state view (e.g. `upload`, `profile`), only
   *   the in-app state changes; the URL stays on the current path. This
   *   matches how YouTube handles `/studio` vs `/watch/<id>`.
   *
   * The optional `skipHistoryPush` flag is used internally by
   * `syncViewFromUrl` to update the store from a popstate event without
   * pushing a duplicate entry.
   */
  navigate: (view: View, opts?: { skipHistoryPush?: boolean }) => void
  goHome: () => void
}

export const useNavigation = create<NavigationStore>((set) => ({
  currentView: { page: 'home' },
  navigate: (view, opts) => {
    set({ currentView: view })
    if (!opts?.skipHistoryPush && typeof window !== 'undefined') {
      const path = viewToPath(view)
      // Only push if the path actually changes — avoids duplicate history
      // entries when navigating between account-state views.
      if (path !== '/' || window.location.pathname !== '/') {
        if (path !== window.location.pathname + window.location.search) {
          window.history.pushState({ view }, '', path)
        }
      }
    }
  },
  goHome: () => {
    set({ currentView: { page: 'home' } })
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.pushState({ page: 'home' }, '', '/')
    }
  },
}))

// Auth store
interface AuthUser {
  id: string
  email: string
  username: string
  role: string
  channelId: string | null
}

interface AuthStore {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  clearUser: () => void
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading: isLoading }),
  clearUser: () => set({ user: null }),
}))
