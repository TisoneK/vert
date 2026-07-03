'use client'

import { useEffect } from 'react'

/**
 * error.tsx — catches all unhandled errors in server and client components.
 * Shows a clean 500-style page instead of a blank screen or Vercel default.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <p className="text-6xl font-bold text-zinc-900 tracking-tight">500</p>
      <p className="text-zinc-500 mt-2 text-sm">Something went wrong.</p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={reset}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Try again
        </button>
        <a
          href="/"
          className="px-4 py-2 border border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 text-sm font-medium rounded-lg transition-colors"
        >
          Go home
        </a>
      </div>
    </div>
  )
}
