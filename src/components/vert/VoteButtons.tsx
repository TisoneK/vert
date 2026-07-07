'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { useAuth } from '@/lib/store'
import { formatViews } from '@/lib/utils-vert'

interface VoteButtonsProps {
  videoId: string
  likeCount: number
  dislikeCount: number
  userVote: string | null
}

export function VoteButtons({ videoId, likeCount: initialLikes, dislikeCount: initialDislikes, userVote: initialVote }: VoteButtonsProps) {
  const { user } = useAuth()
  const [likeCount, setLikeCount] = useState(initialLikes)
  const [dislikeCount, setDislikeCount] = useState(initialDislikes)
  const [userVote, setUserVote] = useState<string | null>(initialVote)
  const [loading, setLoading] = useState(false)
  const [animatingVote, setAnimatingVote] = useState<string | null>(null)

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!user) return
    setAnimatingVote(voteType)
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/videos/${videoId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType }),
      })
      const data = await res.json()

      if (data.action === 'removed') {
        setUserVote(null)
        if (voteType === 'like') setLikeCount((c) => c - 1)
        else setDislikeCount((c) => c - 1)
      } else if (data.action === 'changed') {
        setUserVote(voteType)
        if (voteType === 'like') {
          setLikeCount((c) => c + 1)
          setDislikeCount((c) => c - 1)
        } else {
          setDislikeCount((c) => c + 1)
          setLikeCount((c) => c - 1)
        }
      } else if (data.action === 'created') {
        setUserVote(voteType)
        if (voteType === 'like') setLikeCount((c) => c + 1)
        else setDislikeCount((c) => c + 1)
      }
    } catch (error) {
      console.error('Vote error:', error)
    } finally {
      setLoading(false)
      setTimeout(() => setAnimatingVote(null), 250)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote('like')}
        disabled={loading || !user}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors active:scale-95 duration-100 ${
          animatingVote === 'like' ? 'animate-vote-pulse' : ''
        } ${
          userVote === 'like'
            ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
        } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        <span className="text-xs">{formatViews(likeCount)}</span>
      </button>
      <button
        onClick={() => handleVote('dislike')}
        disabled={loading || !user}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm font-medium transition-colors active:scale-95 duration-100 ${
          animatingVote === 'dislike' ? 'animate-vote-pulse' : ''
        } ${
          userVote === 'dislike'
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
        } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
