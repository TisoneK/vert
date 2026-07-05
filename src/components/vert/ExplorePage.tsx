'use client'

import { fetchWithRetry } from '@/lib/fetch-retry'
import { useState, useEffect } from 'react'
import { useNavigation } from '@/lib/store'
import {
  Music,
  Trophy,
  Gamepad2,
  Film,
  Newspaper,
  Monitor,
  Cpu,
  Compass,
  Utensils,
  Palette,
  Dumbbell,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { ShelfSkeleton } from './Skeleton'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  videoCount: number
}

const categoryIconMap: Record<string, LucideIcon> = {
  music: Music,
  sports: Trophy,
  gaming: Gamepad2,
  entertainment: Film,
  news: Newspaper,
  education: Monitor,
  comedy: Sparkles,
  tech: Cpu,
  travel: Compass,
  food: Utensils,
  fitness: Dumbbell,
  art: Palette,
  other: Film,
}

// Per-slug color theme for category tiles — gives the grid visual variety
// while staying inside Vert's design language (soft pastel backgrounds).
const categoryColorMap: Record<string, { bg: string; fg: string }> = {
  music: { bg: 'bg-pink-50', fg: 'text-pink-600' },
  sports: { bg: 'bg-orange-50', fg: 'text-orange-600' },
  gaming: { bg: 'bg-violet-50', fg: 'text-violet-600' },
  entertainment: { bg: 'bg-amber-50', fg: 'text-amber-600' },
  news: { bg: 'bg-slate-100', fg: 'text-slate-700' },
  education: { bg: 'bg-blue-50', fg: 'text-blue-600' },
  comedy: { bg: 'bg-yellow-50', fg: 'text-yellow-700' },
  tech: { bg: 'bg-cyan-50', fg: 'text-cyan-600' },
  travel: { bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  food: { bg: 'bg-red-50', fg: 'text-red-600' },
  fitness: { bg: 'bg-lime-50', fg: 'text-lime-700' },
  art: { bg: 'bg-fuchsia-50', fg: 'text-fuchsia-600' },
  other: { bg: 'bg-zinc-100', fg: 'text-zinc-600' },
}

const fallbackTheme = { bg: 'bg-violet-50', fg: 'text-violet-600' }

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
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <Compass className="h-4 w-4 text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Explore</h1>
        </div>
        <p className="text-zinc-500 text-sm ml-10">Browse videos by category</p>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
            <Compass className="h-6 w-6 text-zinc-400" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900">No categories yet</h2>
          <p className="text-sm text-zinc-500 mt-1">Check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {categories.map((cat) => {
            const Icon = categoryIconMap[cat.slug] || Film
            const theme = categoryColorMap[cat.slug] || fallbackTheme
            return (
              <button
                key={cat.id}
                onClick={() => navigate({ page: 'category', slug: cat.slug })}
                className="group relative overflow-hidden rounded-xl p-4 md:p-5 text-left bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1"
              >
                <div className={`w-10 h-10 rounded-lg ${theme.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-5 w-5 ${theme.fg}`} />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-zinc-700 transition-colors">
                  {cat.name}
                </h3>
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
