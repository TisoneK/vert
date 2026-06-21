'use client'

import { VertApp } from '@/components/vert/VertApp'

/**
 * /search?q=<query> — deep-linkable search results page.
 *
 * VertApp's popstate handler reads `window.location.search` for the `q`
 * parameter on mount and on back/forward navigation.
 */
export default function SearchRoutePage() {
  return <VertApp />
}
