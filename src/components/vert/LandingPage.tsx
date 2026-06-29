'use client'

import { useState, useEffect } from 'react'
import { useNavigation } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

interface Video {
  id: string
  title: string
  thumbnailUrl: string | null
  viewCount: number
  channel: { channelName: string }
}

export function LandingPage() {
  const { navigate } = useNavigation()
  const [trending, setTrending] = useState<Video[]>([])

  useEffect(() => {
    fetch('/api/v1/trending?limit=8')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setTrending(d.videos || []))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-zinc-900 tracking-tight">Vert</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ page: 'login' })}
              className="text-zinc-600 hover:text-zinc-900"
            >
              Log in
            </Button>
            <Button
              size="sm"
              onClick={() => navigate({ page: 'signup' })}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium"
            >
              Sign up
            </Button>
          </div>
        </div>
      </nav>

      {/* Headline + content */}
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        <h1 className="text-2xl md:text-4xl font-bold text-zinc-900 tracking-tight max-w-2xl">
          Watch and share portrait video.
        </h1>
        <p className="text-zinc-500 mt-2 text-sm md:text-base">
          A clean player, real notifications, no algorithm noise.
        </p>

        {trending.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {trending.map((v) => (
              <div
                key={v.id}
                onClick={() => navigate({ page: 'video', videoId: v.id })}
                className="cursor-pointer group"
              >
                <div className="aspect-[9/16] rounded-lg overflow-hidden bg-zinc-100 relative">
                  {v.thumbnailUrl ? (
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                      <Play className="h-6 w-6 text-zinc-400" />
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium text-zinc-900 mt-2 line-clamp-2 group-hover:text-zinc-600 transition-colors">
                  {v.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">{v.channel.channelName}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
