'use client'

import { fetchWithRetry } from '@/lib/fetch-retry'
import { useState, useEffect } from 'react'
import { useNavigation } from '@/lib/store'
import { Music, Trophy, Gamepad2, Film, Newspaper, Monitor, Cpu, Compass } from 'lucide-react'
import { ShelfSkeleton } from './Skeleton'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  videoCount: number
}

const categoryIconMap: Record<string, React.ElementType> = {
  music: Music,
  sports: Trophy,
  gaming: Gamepad2,
  entertainment: Film,
  news: Newspaper,
  education: Monitor,
  comedy: Film,
  tech: Cpu,
  travel: Compass,
  food: Film,
  fitness: Trophy,
  art: Film,
  other: Film,
}

export function ExplorePage() {
  const { navigate } = useNavigation()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    setLoading(true)
    try {
      const res = await fetchWithRetry('/api/v1/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories ?? [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <ShelfSkeleton />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-vert-fade-in">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Categories</h1>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <Compass className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">No categories yet</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Check back later.</p>
        </div>
      ) : (
        (() => {
          // Split into categories with videos vs empty so the page doesn't
          // look dead when most categories have no content. Categories with
          // videos get full-color cards; empty ones get muted cards in a
          // separate section so users can still discover them.
          const withVideos = categories.filter((c) => c.videoCount > 0)
          const empty = categories.filter((c) => c.videoCount === 0)
          return (
            <>
              {withVideos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {withVideos.map((cat) => {
                    const Icon = categoryIconMap[cat.slug] || Film
                    return (
                      <button
                        key={cat.id}
                        onClick={() => navigate({ page: 'category', slug: cat.slug })}
                        className="group flex items-center gap-3 rounded-lg p-3 md:p-4 text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm active:scale-[0.98] transition-all"
                      >
                        <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
                          <Icon className="h-5 w-5 md:h-6 md:w-6 text-violet-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 transition-colors truncate">{cat.name}</h3>
                          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
                            {cat.videoCount} {cat.videoCount === 1 ? 'video' : 'videos'}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {empty.length > 0 && (
                <>
                  <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-8 mb-3">
                    {withVideos.length > 0 ? 'More categories' : 'All categories'}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {empty.map((cat) => {
                      const Icon = categoryIconMap[cat.slug] || Film
                      return (
                        <button
                          key={cat.id}
                          onClick={() => navigate({ page: 'category', slug: cat.slug })}
                          className="group flex items-center gap-3 rounded-lg p-3 md:p-4 text-left bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-600 hover:bg-white dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
                        >
                          <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                            <Icon className="h-5 w-5 md:h-6 md:w-6 text-zinc-400 dark:text-zinc-500" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors truncate">{cat.name}</h3>
                            <p className="text-zinc-300 dark:text-zinc-600 text-xs mt-0.5">No videos yet</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </>
          )
        })()
      )}
    </div>
  )
}
