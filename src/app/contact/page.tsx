'use client'

import { VertApp } from '@/components/vert/VertApp'

/**
 * /contact — deep-linkable contact page.
 *
 * Without this file, navigating to /contact on the production host (Vercel)
 * hits Next.js' not-found boundary because `contact` is not in `pathToView`'s
 * deep-link map (it lives only inside the in-app Zustand store).
 *
 * This file is a thin wrapper around <VertApp /> exactly like /trending and
 * /explore — VertApp parses the URL on mount and renders <ContactPage />.
 */
export default function ContactRoutePage() {
  return <VertApp />
}
