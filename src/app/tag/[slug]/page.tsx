import type { Metadata } from 'next'
import { VertApp } from '@/components/vert/VertApp'
import { db } from '@/lib/db'
import { SITE_NAME, absoluteUrl, clampDescription, FALLBACK_METADATA } from '@/lib/site-metadata'

/**
 * /tag/[slug] — deep-linkable tag page. Server component so it can emit
 * per-tag metadata; interactive view renders in <VertApp/>. See ADR-25.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const tag = await db.tag.findUnique({
      where: { name: slug },
      select: { label: true },
    })

    const label = tag?.label || slug
    const title = `#${label} · ${SITE_NAME}`
    const description = clampDescription(`Watch #${label} portrait videos on ${SITE_NAME}.`)
    const canonical = absoluteUrl(`/tag/${slug}`)

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, type: 'website', url: canonical, siteName: SITE_NAME },
      twitter: { card: 'summary', title, description },
    }
  } catch {
    return FALLBACK_METADATA
  }
}

export default function TagRoutePage({ params }: { params: Promise<{ slug: string }> }) {
  void params
  return <VertApp />
}
