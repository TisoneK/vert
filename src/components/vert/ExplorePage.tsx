'use client'

import { useState, useEffect } from 'react'
import { useNavigation } from '@/lib/store'
import { Compass, Music, Trophy, Gamepad2, Film, Newspaper, Monitor, Cpu } from 'lucide-react'
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
      const res = await fetch('/api/v1/categories')
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
    <div className="p-4 md:p-6 animate-vert-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Compass className="h-5 w-5 text-zinc-600" />
          <h1 className="text-xl font-bold text-zinc-900">Explore</h1>
        </div>
        <p className="text-zinc-700 text-sm">Discover content by category</p>
      </div>

      {/* Featured section */}
      <div className="mb-8 p-5 rounded-lg bg-zinc-50 border border-zinc-200">
        <h2 className="text-base font-semibold text-zinc-900 mb-2">Featured on Vert</h2>
        <p className="text-zinc-600 text-sm mb-4">
          Browse categories to find your next favorite content
        </p>
        <button
          onClick={() => navigate({ page: 'trending' })}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors active:scale-95 duration-100"
        >
          See What&apos;s Trending
        </button>
      </div>

      {/* Category grid */}
      <h2 className="text-base font-semibold text-zinc-900 mb-4">Browse Categories</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const Icon = categoryIconMap[cat.slug] || Film
          return (
            <button
              key={cat.id}
              onClick={() => navigate({ page: 'category', slug: cat.slug })}
              className="group relative overflow-hidden rounded-lg p-4 text-left bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-all hover:-translate-y-0.5 hover:shadow-lg duration-200"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-zinc-200 flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-zinc-600" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900">{cat.name}</h3>
                <p className="text-zinc-700 text-xs mt-1">
                  {cat.videoCount} video{cat.videoCount !== 1 ? 's' : ''}
                </p>
                {cat.description && (
                  <p className="text-zinc-600 text-[10px] mt-1 line-clamp-2">{cat.description}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
