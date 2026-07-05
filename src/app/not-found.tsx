import Link from 'next/link'
import { Home, Search } from 'lucide-react'

/**
 * not-found.tsx — catches all 404s (unknown routes, deleted videos, etc.)
 *
 * Visually:
 * - Larger headline + clearer hierarchy
 * - Two action buttons (Go home, Browse trending) so visitors aren't
 *   forced to lose their context by going all the way back to /
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mb-5">
        <Search className="h-6 w-6 text-violet-600" />
      </div>
      <p className="text-5xl md:text-6xl font-bold text-zinc-900 tracking-tight">404</p>
      <p className="text-zinc-500 mt-3 text-sm md:text-base text-center max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Home className="h-4 w-4" />
          Go home
        </Link>
        <Link
          href="/trending"
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900 text-sm font-medium rounded-lg transition-colors"
        >
          Browse trending
        </Link>
      </div>
    </div>
  )
}
