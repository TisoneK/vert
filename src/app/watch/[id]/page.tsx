'use client'

import { VertApp } from '@/components/vert/VertApp'

/**
 * /watch/[id] — deep-linkable video page.
 *
 * The actual video rendering happens inside <VertApp />, which on mount
 * parses window.location and sets the Zustand navigation store to
 * { page: 'video', videoId: <id> }.
 *
 * This page exists primarily so that:
 *   1. The URL is shareable (a user can copy-paste /watch/<id> and it works)
 *   2. SEO crawlers see a distinct URL per video
 *   3. Browser back/forward works (handled in VertApp via popstate)
 *
 * We use 'use client' because the entire VertApp is client-side rendered
 * (Zustand store + NextAuth session fetch). A future SSR pass could populate
 * OpenGraph metadata here using the [id] param + a direct DB lookup.
 */
export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  // We don't actually need to read params client-side — VertApp parses
  // window.location directly. But we await params so Next.js knows this is
  // a dynamic route and doesn't try to statically generate it.
  void params
  return <VertApp />
}
