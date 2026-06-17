'use client'

import { useState, useEffect } from 'react'
import { useNavigation, useAuth } from '@/lib/store'
import { BarChart3, Eye, ThumbsUp, Users, Film, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatViews } from '@/lib/utils-vert'

interface CreatorStats {
  totalVideos: number
  totalViews: number
  totalLikes: number
  totalDislikes: number
  subscriberCount: number
  channelName: string
}

interface CreatorVideo {
  id: string
  title: string
  thumbnailUrl: string | null
  durationSeconds: number | null
  viewCount: number
  likeCount: number
  dislikeCount: number
  status: string
  format: string
  createdAt: string
  commentCount: number
}

export function CreatorStudio() {
  const { navigate } = useNavigation()
  const { user } = useAuth()
  const [stats, setStats] = useState<CreatorStats | null>(null)
  const [videos, setVideos] = useState<CreatorVideo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.channelId) {
      fetchStats()
      fetchVideos()
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchStats() {
    try {
      const res = await fetch('/api/v1/creator/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch creator stats:', error)
    }
  }

  async function fetchVideos() {
    try {
      const res = await fetch('/api/v1/creator/videos?limit=20')
      if (res.ok) {
        const data = await res.json()
        setVideos(data.videos)
      }
    } catch (error) {
      console.error('Failed to fetch creator videos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    navigate({ page: 'login' })
    return null
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-zinc-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-zinc-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  const statCards = [
    { icon: Eye, label: 'Total Views', value: stats?.totalViews || 0, color: 'text-violet-600' },
    { icon: ThumbsUp, label: 'Total Likes', value: stats?.totalLikes || 0, color: 'text-zinc-600' },
    { icon: Film, label: 'Total Videos', value: stats?.totalVideos || 0, color: 'text-emerald-600' },
    { icon: Users, label: 'Subscribers', value: stats?.subscriberCount || 0, color: 'text-amber-600' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-vert-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-zinc-600" />
            <h1 className="text-xl font-bold text-zinc-900">Creator Studio</h1>
          </div>
          <p className="text-zinc-700 text-sm">
            {stats?.channelName || 'Your channel'} analytics
          </p>
        </div>
        <Button
          onClick={() => navigate({ page: 'upload' })}
          className="bg-violet-600 hover:bg-violet-700 text-white font-medium active:scale-95 transition-transform duration-100"
        >
          Upload Video
        </Button>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-zinc-900">
              {typeof stat.value === 'number' && stat.value > 999 ? formatViews(stat.value) : stat.value.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-700 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Videos table */}
      <div className="bg-zinc-50 rounded-lg border border-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">Your Videos</h2>
        </div>
        {videos.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-zinc-700">No videos yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left text-xs font-medium text-zinc-700 px-4 py-3">Video</th>
                  <th className="text-right text-xs font-medium text-zinc-700 px-4 py-3">Views</th>
                  <th className="text-right text-xs font-medium text-zinc-700 px-4 py-3">Likes</th>
                  <th className="text-right text-xs font-medium text-zinc-700 px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-zinc-700 px-4 py-3">Format</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <tr
                    key={video.id}
                    className="border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors"
                    onClick={() => navigate({ page: 'video', videoId: video.id })}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 rounded bg-zinc-200 flex items-center justify-center shrink-0 overflow-hidden">
                          {video.thumbnailUrl ? (
                            <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Film className="h-4 w-4 text-zinc-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-zinc-900 font-medium line-clamp-1">{video.title}</p>
                          <p className="text-xs text-zinc-700">{new Date(video.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 text-sm text-zinc-600">{video.viewCount.toLocaleString()}</td>
                    <td className="text-right px-4 py-3 text-sm text-zinc-600">{video.likeCount.toLocaleString()}</td>
                    <td className="text-right px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        video.status === 'ready'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {video.status}
                      </span>
                    </td>
                    <td className="text-right px-4 py-3 text-xs text-zinc-700 capitalize">{video.format}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
