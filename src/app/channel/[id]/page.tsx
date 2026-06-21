'use client'

import { VertApp } from '@/components/vert/VertApp'

/**
 * /channel/[id] — deep-linkable channel page.
 *
 * See /watch/[id]/page.tsx for the rationale on why this is a thin wrapper
 * around <VertApp />.
 */
export default function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  void params
  return <VertApp />
}
