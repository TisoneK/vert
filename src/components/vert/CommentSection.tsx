'use client'

import Image from 'next/image'
import { isNextImageSafeUrl } from '@/lib/image-utils'
import { fetchWithRetry } from '@/lib/fetch-retry'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth, useNavigation } from '@/lib/store'
import { timeAgo } from '@/lib/utils-vert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Trash2, ChevronDown } from 'lucide-react'
import { CommentSkeleton } from './Skeleton'

interface Comment {
  id: string
  content: string
  createdAt: string
  isRemoved: boolean
  likeCount?: number
  user: {
    id: string
    username: string
    avatarUrl: string | null
  }
}

interface CommentSectionProps {
  videoId: string
  compact?: boolean
}

type SortOption = 'top' | 'newest'

export function CommentSection({ videoId, compact = false }: CommentSectionProps) {
  const { user } = useAuth()
  const { navigate } = useNavigation()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [sort, setSort] = useState<SortOption>('top')
  const [failedAvatarUrls, setFailedAvatarUrls] = useState<Set<string>>(new Set())
  const commentRequestRef = useRef(0)

  const fetchComments = useCallback(async (pageNum: number, reset = false) => {
    const requestId = ++commentRequestRef.current
    if (reset) setPage(1)
    setLoading(true)
    try {
      const res = await fetchWithRetry(`/api/v1/videos/${videoId}/comments?page=${pageNum}&limit=20`)
      const data = await res.json()
      if (requestId !== commentRequestRef.current) return
      if (reset) {
        setComments(data.comments)
      } else {
        setComments((prev) => [...prev, ...data.comments])
      }
      setHasMore(pageNum < data.pagination.totalPages)
    } catch (error) {
      if (requestId === commentRequestRef.current) {
        console.error('Failed to fetch comments:', error)
      }
    } finally {
      if (requestId === commentRequestRef.current) setLoading(false)
    }
  }, [videoId])

  useEffect(() => {
    // The fetch callback synchronizes remote comments and pagination state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComments(1, true)
  }, [fetchComments, sort])

  async function handleSubmit() {
    if (!newComment.trim() || !user) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/videos/${videoId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      if (res.ok) {
        const comment = await res.json()
        setComments((prev) => [comment, ...prev])
        setNewComment('')
      }
    } catch (error) {
      console.error('Comment error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(commentId: string) {
    try {
      const res = await fetch(`/api/v1/comments/${commentId}`, { method: 'DELETE' })
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId))
      }
    } catch (error) {
      console.error('Delete comment error:', error)
    }
  }

  const sortedComments = [...comments].sort((a, b) => {
    if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return 0 // 'top' - default order from API
  })
  const isEmpty = !loading && sortedComments.length === 0

  return (
    <div className={compact ? 'mt-0' : 'mt-6'}>
      {/* Header with count and sort */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {comments.length > 0 ? `${comments.length} Comment${comments.length !== 1 ? 's' : ''}` : 'Comments'}
        </h3>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="appearance-none bg-transparent text-xs text-zinc-600 dark:text-zinc-400 pr-4 pl-2 py-1 rounded cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1"
          >
            <option value="top">Top comments</option>
            <option value="newest">Newest first</option>
          </select>
          <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600 dark:text-zinc-400 pointer-events-none" />
        </div>
      </div>

      {/* Add comment */}
      {user ? (
        <div className={`flex gap-3 ${isEmpty ? 'mb-3' : 'mb-6'}`}>
          <div className="shrink-0">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 text-xs font-bold">
              {user.username[0]?.toUpperCase()}
            </div>
          </div>
          <div className="flex-1">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 min-h-[60px] resize-none text-sm shadow-sm focus-visible:border-violet-500 focus-visible:ring-violet-600"
            />
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting || !newComment.trim()}
                className="bg-violet-600 hover:bg-violet-700 text-white font-medium active:scale-95 transition-transform duration-100"
              >
                {submitting ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Comment
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60 dark:shadow-none ${isEmpty ? 'mb-3' : 'mb-6'}`}>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Join the conversation by signing in.
          </p>
          <Button
            size="sm"
            onClick={() => navigate({ page: 'login' })}
            className="shrink-0 bg-violet-600 text-white hover:bg-violet-700"
          >
            Log in to comment
          </Button>
        </div>
      )}

      {/* Comments list */}
      {loading && comments.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      ) : sortedComments.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-300 pt-0.5 pb-2">
          Be the first to start the conversation.
        </p>
      ) : (
        <div className={compact ? 'space-y-4' : 'space-y-4 max-h-96 overflow-y-auto custom-scrollbar'}>
          {sortedComments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <div className="shrink-0">
                {comment.user.avatarUrl && !failedAvatarUrls.has(comment.user.avatarUrl) ? (
                  isNextImageSafeUrl(comment.user.avatarUrl) ? (
                    <Image
                      src={comment.user.avatarUrl}
                      alt={comment.user.username}
                      width={32}
                      height={32}
                      loading="lazy"
                      className="w-8 h-8 rounded-full object-cover"
                      onError={() => setFailedAvatarUrls((prev) => new Set(prev).add(comment.user.avatarUrl!))}
                    />
                  ) : (
                    <img
                      src={comment.user.avatarUrl}
                      alt={comment.user.username}
                      loading="lazy"
                      decoding="async"
                      onError={() => setFailedAvatarUrls((prev) => new Set(prev).add(comment.user.avatarUrl!))}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 text-xs font-bold">
                    {comment.user.username[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    {comment.user.username}
                  </span>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    {timeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-400 mt-0.5">{comment.content}</p>
              </div>
              {user && (user.id === comment.user.id || user.role === 'admin') && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  // Always visible on mobile (no hover), hover-revealed on
                  // desktop. The opacity-0 group-hover:opacity-100 pattern
                  // left mobile users with no way to delete their own comments.
                  className="shrink-0 text-zinc-500 dark:text-zinc-400 hover:text-red-600 transition-colors p-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                  aria-label={`Delete comment from ${comment.user.username}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const nextPage = page + 1
              setPage(nextPage)
              fetchComments(nextPage)
            }}
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-sm"
          >
            Load More Comments
          </Button>
        </div>
      )}
    </div>
  )
}
