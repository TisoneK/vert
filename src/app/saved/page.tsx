'use client'

import { VertApp } from '@/components/vert/VertApp'

/**
 * /saved — saved videos page.
 * Renders the VertApp shell, which parses the URL and shows the SavedPage
 * view. Requires auth — VertApp redirects to login if the user isn't signed in.
 */
export default function SavedRoutePage() {
  return <VertApp />
}
