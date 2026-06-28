'use client'

import { VertApp } from '@/components/vert/VertApp'

/**
 * /tag/[slug] — deep-linkable tag page.
 *
 * VertApp parses window.location on mount and sets the Zustand store to
 * { page: 'tag', slug: <slug> }, which renders <TagPage />.
 */
export default function TagRoutePage({ params }: { params: Promise<{ slug: string }> }) {
  void params
  return <VertApp />
}
