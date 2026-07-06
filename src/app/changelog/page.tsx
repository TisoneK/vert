'use client'

import { VertApp } from '@/components/vert/VertApp'

/**
 * /changelog — public changelog page.
 *
 * Renders the project's CHANGELOG.md (parsed server-side by
 * /api/v1/changelog) in a readable, styled layout. No auth required.
 */
export default function ChangelogRoutePage() {
  return <VertApp />
}
