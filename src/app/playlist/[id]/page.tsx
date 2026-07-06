'use client'

import { VertApp } from '@/components/vert/VertApp'

/**
 * /playlist/[id] — deep-linkable playlist detail page.
 */
export default function PlaylistDetailRoutePage({ params }: { params: Promise<{ id: string }> }) {
  void params
  return <VertApp />
}
