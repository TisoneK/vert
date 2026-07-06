'use client'

import { VertApp } from '@/components/vert/VertApp'

/**
 * /creator-studio — creator analytics dashboard.
 * Renders the VertApp shell, which parses the URL and shows the CreatorStudio
 * view. Requires auth + a channel — VertApp redirects to login if the user
 * isn't signed in.
 */
export default function CreatorStudioRoutePage() {
  return <VertApp />
}
