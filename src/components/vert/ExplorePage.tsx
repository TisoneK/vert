'use client'

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
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-vert-fade-in">
      <h1 className="text-xl font-bold text-zinc-900 mb-6">Categories</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {categories.map((cat) => {
          const Icon = categoryIconMap[cat.slug] || Film
          return (
            <button
              key={cat.id}
              onClick={() => navigate({ page: 'category', slug: cat.slug })}
              className="group rounded-lg p-4 text-left bg-white border border-zinc-200 hover:border-zinc-300 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center mb-3">
                <Icon className="h-4 w-4 text-zinc-600" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors">{cat.name}</h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                {cat.videoCount} {cat.videoCount === 1 ? 'video' : 'videos'}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
