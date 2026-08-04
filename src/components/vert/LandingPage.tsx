'use client'

import { useState, useEffect } from 'react'
import { useNavigation } from '@/lib/store'
import { usePrefetchVideo } from '@/lib/use-prefetch-video'
import { Button } from '@/components/ui/button'
import { Play, Hash } from 'lucide-react'

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
  const prefetchVideo = usePrefetchVideo()
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
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-zinc-100 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Vert</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ page: 'login' })}
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Log in
            </Button>
            <Button
              size="sm"
              onClick={() => navigate({ page: 'signup' })}
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium"
            >
              Sign up
            </Button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 md:py-14">
        <h1 className="text-2xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight max-w-2xl">
          Watch and share portrait video.
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-3 text-sm md:text-base leading-relaxed">
          A clean player, real notifications, no algorithm noise.
        </p>

        {/* Trending */}
        {trending.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Trending</h2>
              <button
                onClick={() => navigate({ page: 'trending' })}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium"
              >
                See all
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {trending.map((v) => (
                <div
                  key={v.id}
                  onClick={() => navigate({ page: 'video', videoId: v.id })}
                  // Warm the watch page's data on hover/touch intent — same
                  // pre-fetch as the main VideoCard (see .context ADR-3).
                  onMouseEnter={() => prefetchVideo(v.id)}
                  onTouchStart={() => prefetchVideo(v.id)}
                  // h-full + flex flex-col so cards in the same row stretch to
                  // equal height regardless of title length. Without this, a
                  // card with a 1-line title is shorter than one with a 2-line
                  // title, making the grid look ragged.
                  className="cursor-pointer group h-full flex flex-col"
                >
                  <div className="aspect-[9/16] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 relative">
                    {v.thumbnailUrl ? (
                      <img
                        src={v.thumbnailUrl}
                        alt={v.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                        <Play className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-2 line-clamp-2 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
                    {v.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{v.channel.channelName}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Popular tags */}
        {tags.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Popular tags</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => navigate({ page: 'tag', slug: tag.name })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-medium transition-colors"
                >
                  <Hash className="h-3 w-3" />
                  {tag.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Sign-up CTA */}
        <section className="mt-14 p-6 md:p-8 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Start your channel
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 mb-4">
            Upload portrait video, get notified when people engage, build an audience.
          </p>
          <Button
            onClick={() => navigate({ page: 'signup' })}
            className="bg-violet-600 hover:bg-violet-700 text-white font-medium"
          >
            Create an account
          </Button>
        </section>
      </div>

      {/* Footer — Vert wordmark on the left, secondary links on the right.
          The wordmark uses a slightly heavier weight than the links so the
          visual weight is balanced (both were text-zinc-400 before, which
          made the wordmark look like a placeholder). */}
      <footer className="border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Vert</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate({ page: 'changelog' })}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Changelog
            </button>
            <button
              onClick={() => navigate({ page: 'contact' })}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Contact
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
