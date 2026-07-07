'use client'

import { useState, useEffect } from 'react'
import { ScrollText, Loader2, AlertCircle } from 'lucide-react'

interface ChangelogSection {
  version: string
  date: string | null
  label: string
  id: string
  html: string
}

export function ChangelogPage() {
  const [sections, setSections] = useState<ChangelogSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    fetchChangelog()
  }, [])

  // Track which section is in view for the sticky sidebar highlight.
  useEffect(() => {
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )

    for (const section of sections) {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    }

    // Default to first section
    if (!activeId && sections.length > 0) {
      setActiveId(sections[0]!.id)
    }

    return () => observer.disconnect()
  }, [sections])

  async function fetchChangelog() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/changelog')
      if (res.ok) {
        const data = await res.json()
        setSections(data.sections ?? [])
      } else {
        setError('Failed to load changelog')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  function scrollToSection(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <AlertCircle className="h-10 w-10 text-zinc-400 dark:text-zinc-500 mb-3" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{error}</p>
        <button
          onClick={fetchChangelog}
          className="mt-3 text-sm text-violet-600 hover:text-violet-700 font-medium"
        >
          Try again
        </button>
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <ScrollText className="h-10 w-10 text-zinc-400 dark:text-zinc-500 mb-3" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No changelog entries yet.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10 animate-vert-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-2 mb-8">
        <ScrollText className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Changelog</h1>
        <span className="text-sm text-zinc-400 dark:text-zinc-500 ml-2">New things and fixes in Vert</span>
      </div>

      <div className="flex gap-8">
        {/* Sticky version sidebar — desktop only */}
        <aside className="hidden md:block w-44 shrink-0">
          <div className="sticky top-20 space-y-1">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3 px-3">Versions</p>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                  activeId === section.id
                    ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="block">{section.version}</span>
                {section.date && (
                  <span className="block text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{section.date}</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content — version sections */}
        <div className="flex-1 min-w-0 space-y-12">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-20"
            >
              {/* Version header — mobile shows badge inline, desktop shows it as a card top */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-zinc-200 dark:border-zinc-700">
                <span className="inline-flex items-center px-3 py-1 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-sm font-semibold font-mono">
                  {section.version}
                </span>
                {section.date && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{section.date}</span>
                )}
              </div>

              {/* Section body — rendered markdown */}
              <div
                className="changelog-content"
                dangerouslySetInnerHTML={{ __html: section.html }}
              />
            </section>
          ))}
        </div>
      </div>

      {/* Scoped styles for the rendered markdown */}
      <style jsx global>{`
        .changelog-content .changelog-h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #5b21b6;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
          line-height: 1.4;
          scroll-margin-top: 5rem;
        }
        .changelog-content .changelog-h2:first-child {
          margin-top: 0;
        }
        .changelog-content .changelog-h3 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #52525b;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        .changelog-content .changelog-paragraph {
          font-size: 0.95rem;
          line-height: 1.65;
          color: #3f3f46;
          margin-bottom: 0.75rem;
        }
        .changelog-content .changelog-list {
          list-style: none;
          padding-left: 0;
          margin-bottom: 1.25rem;
        }
        .changelog-content .changelog-list-nested {
          list-style: none;
          padding-left: 1.25rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          border-left: 2px solid #f4f4f5;
        }
        .changelog-content .changelog-list-item {
          font-size: 0.95rem;
          line-height: 1.65;
          color: #3f3f46;
          padding-left: 1.25rem;
          position: relative;
          margin-bottom: 0.5rem;
        }
        .changelog-content .changelog-list-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.65rem;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #7c3aed;
        }
        .changelog-content .changelog-code {
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 0.85em;
          background: #f4f4f5;
          color: #7c3aed;
          padding: 0.1rem 0.35rem;
          border-radius: 0.25rem;
          font-weight: 500;
        }
        .changelog-content .changelog-link {
          color: #7c3aed;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .changelog-content .changelog-link:hover {
          color: #5b21b6;
        }
        .changelog-content .changelog-quote {
          border-left: 3px solid #7c3aed;
          padding: 0.5rem 1rem;
          margin: 1rem 0;
          background: #faf5ff;
          border-radius: 0 0.375rem 0.375rem 0;
          font-size: 0.9rem;
          color: #52525b;
        }
        .changelog-content strong {
          font-weight: 600;
          color: #18181b;
        }
        .changelog-content em {
          font-style: italic;
        }
        /* Dark mode overrides */
        .dark .changelog-content .changelog-h3 {
          color: #a1a1aa;
        }
        .dark .changelog-content .changelog-paragraph,
        .dark .changelog-content .changelog-list-item {
          color: #a1a1aa;
        }
        .dark .changelog-content .changelog-list-nested {
          border-left-color: #27272a;
        }
        .dark .changelog-content .changelog-code {
          background: #27272a;
          color: #a78bfa;
        }
        .dark .changelog-content .changelog-link:hover {
          color: #7c3aed;
        }
        .dark .changelog-content .changelog-quote {
          background: #1c1c1f;
          color: #a1a1aa;
        }
        .dark .changelog-content strong {
          color: #f4f4f5;
        }
      `}</style>
    </div>
  )
}
