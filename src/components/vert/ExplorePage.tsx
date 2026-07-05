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
        setCategories(data.categories)
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
      <h1 className="text-xl font-bold text-zinc-900 mb-6">Categories</h1>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
            <Compass className="h-6 w-6 text-zinc-400" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900">No categories yet</h2>
          <p className="text-sm text-zinc-500 mt-1">Check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const Icon = categoryIconMap[cat.slug] || Film
            return (
              <button
                key={cat.id}
                onClick={() => navigate({ page: 'category', slug: cat.slug })}
                className="group rounded-lg p-4 text-left bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center mb-3">
                  <Icon className="h-4 w-4 text-zinc-600" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors">{cat.name}</h3>
                <p className="text-zinc-500 text-xs mt-0.5">
                  {cat.videoCount === 0
                    ? 'No videos yet'
                    : `${cat.videoCount} ${cat.videoCount === 1 ? 'video' : 'videos'}`}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
