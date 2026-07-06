'use client'

import { VertApp } from '@/components/vert/VertApp'

/**
 * /profile — current user's channel/profile page.
 * Renders the VertApp shell, which parses the URL and shows the ProfilePage
 * view. Requires auth — VertApp redirects to login if the user isn't signed in.
 */
export default function ProfileRoutePage() {
  return <VertApp />
}
