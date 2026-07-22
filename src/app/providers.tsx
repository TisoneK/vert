'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

/**
 * App-wide client providers. QueryClientProvider makes react-query available
 * to every component, replacing the old useEffect+fetch+setState data-fetching
 * pattern (which tripped the React-Compiler set-state-in-effect / immutability
 * rules — see .context ADR-2).
 *
 * The QueryClient is created once per app instance via useState's lazy
 * initializer (NOT at module scope), so it isn't shared across requests during
 * SSR and each browser tab gets its own cache.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stays fresh for a minute before a background refetch; the
            // old code refetched on every mount, so this is strictly less
            // chatty while still keeping things current.
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
