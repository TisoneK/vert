'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/store'
import { useCallback } from 'react'
import { videoDetailQueryOptions, relatedVideosQueryOptions } from '@/lib/video-queries'

/**
 * Returns a `prefetch(videoId)` callback that warms the react-query cache for a
 * video's watch page — its primary detail query and its "Up Next" list — ahead
 * of the click. Wire it to `onMouseEnter` / `onTouchStart` on anything that
 * navigates to a video (video cards, Up Next rows). See .context ADR-3.
 *
 * Best-effort and silent: react-query dedups in-flight requests and respects the
 * app's 60s `staleTime`, so repeat hovers within that window cost nothing and no
 * manual debounce is needed. A failed prefetch is a no-op — the click just falls
 * back to a normal on-mount fetch.
 */
export function usePrefetchVideo() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useCallback(
    (videoId: string) => {
      if (!videoId) return
      void queryClient.prefetchQuery(videoDetailQueryOptions(videoId, user?.id ?? 'anonymous'))
      void queryClient.prefetchQuery(relatedVideosQueryOptions(videoId))
    },
    [queryClient, user?.id],
  )
}
