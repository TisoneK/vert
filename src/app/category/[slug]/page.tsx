'use client'

import { VertApp } from '@/components/vert/VertApp'

/**
 * /category/[slug] — deep-linkable category page.
 */
export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  void params
  return <VertApp />
}
