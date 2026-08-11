import Link from 'next/link'

/**
 * not-found.tsx — catches all 404s (unknown routes, deleted videos, etc.)
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center px-4">
      <p className="text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">404</p>
      <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">This page doesn&apos;t exist.</p>
      <Link
        href="/"
        className="mt-6 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Go home
      </Link>
    </div>
  )
}
