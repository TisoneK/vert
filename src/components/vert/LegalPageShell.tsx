import type { ReactNode } from 'react'

/**
 * Server-rendered shell for standalone legal/policy pages (Terms, Privacy).
 * Rendered outside the client <VertApp/> shell, so it uses real <a> links and
 * theme-aware tokens (like not-found.tsx / error.tsx) and is fully crawlable.
 */
export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="text-lg font-bold tracking-tight">Vert</a>
          <a
            href="/"
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            ← Back to Vert
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Last updated: {lastUpdated}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-zinc-900 [&_h2:not(:first-child)]:mt-8 dark:[&_h2]:text-zinc-100 [&_a]:text-violet-600 [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          {children}
        </div>

        <footer className="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400">
          Questions? <a href="/contact" className="text-violet-600 hover:underline">Contact us</a>.
          {' · '}
          <a href="/terms" className="text-violet-600 hover:underline">Terms</a>
          {' · '}
          <a href="/privacy" className="text-violet-600 hover:underline">Privacy</a>
        </footer>
      </main>
    </div>
  )
}
