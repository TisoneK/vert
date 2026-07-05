'use client'

import { useState, useEffect } from 'react'
import { useNavigation } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Play, Hash, Sparkles, ArrowRight, Smartphone } from 'lucide-react'

interface Video {
  id: string
  title: string
  thumbnailUrl: string | null
  viewCount: number
  channel: { channelName: string }
}

interface Tag {
  id: string
  name: string
  label: string
  usageCount: number
}

export function LandingPage() {
  const { navigate } = useNavigation()
  const [trending, setTrending] = useState<Video[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    fetch('/api/v1/trending?limit=6')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setTrending(d.videos || []))
      .catch(() => {})
    fetch('/api/v1/tags?limit=10')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setTags(d.tags || []))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-zinc-100 sticky top-0 z-30 bg-white/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate({ page: 'home' })}
            className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 rounded"
          >
            <span className="text-lg font-bold text-zinc-900 tracking-tight">Vert</span>
          </button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ page: 'login' })}
              className="text-zinc-600 hover:text-zinc-900 font-medium"
            >
              Log in
            </Button>
            <Button
              size="sm"
              onClick={() => navigate({ page: 'signup' })}
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium active:scale-95 transition-transform"
            >
              Sign up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 mb-5">
            <Sparkles className="h-3 w-3 text-violet-600" />
            <span className="text-xs font-medium text-violet-700">Portrait-first video</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight leading-[1.1] max-w-3xl">
            Watch and share portrait video.
          </h1>
          <p className="text-zinc-500 mt-4 text-base md:text-lg max-w-xl leading-relaxed">
            A clean player, real notifications, and no algorithm noise. Built for the way you actually hold your phone.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-7">
            <Button
              onClick={() => navigate({ page: 'signup' })}
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-5 active:scale-95 transition-transform"
            >
              Get started
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ page: 'explore' })}
              className="border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 font-medium"
            >
              <Smartphone className="h-4 w-4 mr-1.5" />
              Explore
            </Button>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 md:py-14">
        {/* Trending */}
        {trending.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Trending now</h2>
              <button
                onClick={() => navigate({ page: 'trending' })}
                className="text-sm text-violet-600 hover:text-violet-700 font-medium inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 rounded"
              >
                See all
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {trending.map((v) => (
                <div
                  key={v.id}
                  onClick={() => navigate({ page: 'video', videoId: v.id })}
                  className="group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 rounded-lg"
                >
                  <div className="aspect-[9/16] rounded-xl overflow-hidden bg-zinc-100 relative ring-1 ring-zinc-200/60 group-hover:ring-zinc-300 transition-all">
                    {v.thumbnailUrl ? (
                      <img
                        src={v.thumbnailUrl}
                        alt={v.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
                        <div className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Play className="h-5 w-5 text-zinc-700 fill-zinc-700 ml-0.5" />
                        </div>
                      </div>
                    )}
                    {/* Hover play overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                      {v.thumbnailUrl && (
                        <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-200 shadow-md">
                          <Play className="h-5 w-5 text-zinc-900 fill-zinc-900 ml-0.5" />
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900 mt-3 line-clamp-2 leading-snug group-hover:text-zinc-700 transition-colors">
                    {v.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">{v.channel.channelName}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Popular tags */}
        {tags.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight mb-4">Popular tags</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => navigate({ page: 'tag', slug: tag.name })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1"
                >
                  <Hash className="h-3.5 w-3.5 text-zinc-400" />
                  {tag.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Sign-up CTA */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 p-8 md:p-10">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10" aria-hidden="true" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Start your channel
            </h2>
            <p className="text-violet-100 text-sm md:text-base mt-2 max-w-md leading-relaxed">
              Upload portrait video, get notified when people engage, and build an audience that actually cares.
            </p>
            <Button
              onClick={() => navigate({ page: 'signup' })}
              className="bg-white text-violet-700 hover:bg-violet-50 font-medium mt-5 active:scale-95 transition-transform"
            >
              Create an account
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-100">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <span className="text-sm text-zinc-400 font-medium">Vert</span>
          <button
            onClick={() => navigate({ page: 'contact' })}
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 rounded"
          >
            Contact
          </button>
        </div>
      </footer>
    </div>
  )
}
