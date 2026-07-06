'use client'

import { VertApp } from '@/components/vert/VertApp'

/**
 * /signup — signup page.
 * Renders the VertApp shell, which parses the URL and shows the SignupForm
 * view. If the user is already signed in, VertApp redirects to the home feed.
 */
export default function SignupRoutePage() {
  return <VertApp />
}
