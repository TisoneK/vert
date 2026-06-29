'use client'

import { useState, useEffect } from 'react'
import { useNavigation } from '@/lib/store'
import { Logo } from './Logo'
import { Button } from '@/components/ui/button'
import { Play, Smartphone, Sparkles, Bell, Hash, TrendingUp, ArrowRight } from 'lucide-react'

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
    fetch('/api/v1/trending?limit=6')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setTrending(d.videos || []))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Nav bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="text-lg font-bold text-zinc-900 tracking-tight">Vert</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ page: 'login' })}
              className="text-zinc-600 hover:text-zinc-900"
            >
              Log In
            </Button>
            <Button
              size="sm"
              onClick={() => navigate({ page: 'signup' })}
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50 via-white to-white" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-medium mb-6">
            <Sparkles className="h-3 w-3" />
            Portrait-first video, done right
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 tracking-tight leading-tight max-w-3xl mx-auto">
            Vertical video,
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-violet-800 bg-clip-text text-transparent">
              built for creators.
            </span>
          </h1>
          <p className="text-lg text-zinc-600 mt-6 max-w-xl mx-auto leading-relaxed">
            Upload, discover, and share portrait video in a clean, fast,
            distraction-free player. No ads. No algorithm noise. Just video.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Button
              size="lg"
              onClick={() => navigate({ page: 'signup' })}
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-8"
            >
              Create your channel
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate({ page: 'login' })}
              className="border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50"
            >
              I have an account
            </Button>
          </div>
          <p className="text-xs text-zinc-400 mt-4">
            Free during beta — no credit card required
          </p>
        </div>
      </section>

      {/* Trending preview */}
      {trending.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-violet-600" />
            <h2 className="text-xl font-bold text-zinc-900">Trending now</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {trending.map((v) => (
              <div
                key={v.id}
                onClick={() => navigate({ page: 'video', videoId: v.id })}
                className="cursor-pointer group"
              >
                <div className="aspect-[9/16] rounded-xl overflow-hidden bg-zinc-100 relative">
                  {v.thumbnailUrl ? (
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
                      <Play className="h-8 w-8 text-zinc-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-sm font-medium text-zinc-900 mt-2 line-clamp-2 group-hover:text-violet-700 transition-colors">
                  {v.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">{v.channel.channelName}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feature strip */}
      <section className="bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <Feature
              icon={<Smartphone className="h-5 w-5" />}
              title="Portrait-native"
              desc="Built for 9:16 from the ground up — not a desktop player squished into a phone screen."
            />
            <Feature
              icon={<Hash className="h-5 w-5" />}
              title="Tag-based discovery"
              desc="Freeform hashtags let creators reach audiences who actually want their content."
            />
            <Feature
              icon={<Bell className="h-5 w-5" />}
              title="Real notifications"
              desc="Know when someone subscribes, comments, or likes — without an algorithm deciding what you see."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Logo size={48} className="mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">
          Ready to share your story?
        </h2>
        <p className="text-zinc-600 mt-3 mb-8">
          Join Vert during beta and help shape what vertical video becomes.
        </p>
        <Button
          size="lg"
          onClick={() => navigate({ page: 'signup' })}
          className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-8"
        >
          Get started free
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="text-sm text-zinc-500">Vert</span>
          </div>
          <p className="text-xs text-zinc-400">© 2026 Vert. Built for portrait video.</p>
        </div>
      </footer>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div>
      <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-zinc-900 mb-1">{title}</h3>
      <p className="text-sm text-zinc-600 leading-relaxed">{desc}</p>
    </div>
  )
}
