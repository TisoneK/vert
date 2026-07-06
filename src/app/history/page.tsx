'use client'

import { VertApp } from '@/components/vert/VertApp'

/**
 * /history — watch history page.
 * Renders the VertApp shell, which parses the URL and shows the HistoryPage
 * view. Requires auth — VertApp redirects to login if the user isn't signed in.
 */
export default function HistoryRoutePage() {
  return <VertApp />
}
