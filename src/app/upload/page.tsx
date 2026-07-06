'use client'

import { VertApp } from '@/components/vert/VertApp'

/**
 * /upload — upload page.
 * Renders the VertApp shell, which parses the URL and shows the UploadPage
 * view. Requires auth — VertApp redirects to login if the user isn't signed in.
 */
export default function UploadRoutePage() {
  return <VertApp />
}
