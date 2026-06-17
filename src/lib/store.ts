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
  | { page: 'explore' }
  | { page: 'history' }
  | { page: 'saved' }
  | { page: 'playlists' }
  | { page: 'creator-studio' }

interface NavigationStore {
  currentView: View
  navigate: (view: View) => void
  goHome: () => void
}

export const useNavigation = create<NavigationStore>((set) => ({
  currentView: { page: 'home' },
  navigate: (view) => set({ currentView: view }),
  goHome: () => set({ currentView: { page: 'home' } }),
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
  setLoading: (isLoading) => set({ isLoading }),
  clearUser: () => set({ user: null }),
}))
