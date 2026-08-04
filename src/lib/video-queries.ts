/**
 * Shared react-query definitions for the watch page's data.
 *
 * Both the watch page (VideoDetail / RelatedVideos, via `useQuery`) and the
 * pre-fetch hook (`usePrefetchVideo`, via `queryClient.prefetchQuery`) import
 * from here. This is the whole point of the module: prefetch only warms the
 * cache the on-mount query later reads if the two use a byte-identical
 * `queryKey` + `queryFn`. Keep them defined in one place so they can never
 * drift apart. See .context ADR-3.
 */
import { fetchWithRetry } from '@/lib/fetch-retry'

export interface VideoDetailResult {
  video: Record<string, unknown>
  userVote: string | null
}

export async function fetchVideoDetail(videoId: string): Promise<VideoDetailResult> {
  const res = await fetchWithRetry(`/api/v1/videos/${videoId}`)
  if (!res.ok) throw new Error(`Failed to fetch video: ${res.status}`)
  const data = await res.json()
  const votes = data.votes as { userId: string; voteType: string }[] | undefined
  let userVote: string | null = null
  try {
    const sessionRes = await fetchWithRetry('/api/auth/session-info')
    const sessionData = await sessionRes.json()
    if (sessionData.user) {
      userVote = votes?.find((v) => v.userId === sessionData.user.id)?.voteType || null
    }
  } catch { /* ignore session errors — just leave userVote null */ }
  return { video: data, userVote }
}

export interface RelatedVideo {
  id: string
  title: string
  thumbnailUrl: string | null
  durationSeconds: number | null
  viewCount: number
  likeCount: number
  createdAt: string
  format: string
  channel: {
    id: string
    channelName: string
    user: { avatarUrl: string | null }
  }
  categories: Array<{ name: string; slug: string }>
}

export async function fetchRelated(videoId: string): Promise<RelatedVideo[]> {
  const res = await fetchWithRetry(`/api/v1/videos/${videoId}/related?limit=10`)
  if (!res.ok) throw new Error(`Failed to fetch related videos: ${res.status}`)
  const data = await res.json()
  return data.videos ?? []
}

/**
 * The watch page's primary (skeleton-gating) query. Passed to both
 * `useQuery` on mount and `prefetchQuery` on hover.  */
export function videoDetailQueryOptions(videoId: string, viewerId = 'anonymous') {

    return {
      queryKey: ['video', videoId, viewerId] as const,
      queryFn: () => fetchVideoDetail(videoId),
    }
  }


/** The "Up Next" list query for the watch page. */
export function relatedVideosQueryOptions(videoId: string) {
  return {
    queryKey: ['related-videos', videoId] as const,
    queryFn: () => fetchRelated(videoId),
  }
}
