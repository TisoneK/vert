'use client'

import { VertApp } from '@/components/vert/VertApp'

/**
 * /login — login page.
 * Renders the VertApp shell, which parses the URL and shows the LoginForm
 * view. If the user is already signed in, VertApp redirects to the home feed.
 */
export default function LoginRoutePage() {
  return <VertApp />
}
