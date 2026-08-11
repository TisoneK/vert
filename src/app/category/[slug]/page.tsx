import type { Metadata } from 'next'
import { VertApp } from '@/components/vert/VertApp'
import { db } from '@/lib/db'
import { SITE_NAME, absoluteUrl, clampDescription, FALLBACK_METADATA } from '@/lib/site-metadata'

/**
 * /category/[slug] — deep-linkable category page. Server component so it can
 * emit per-category metadata; interactive view renders in <VertApp/>. ADR-25.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const category = await db.category.findUnique({
      where: { slug },
      select: { name: true, description: true },
    })

    if (!category) return FALLBACK_METADATA

    const title = `${category.name} videos · ${SITE_NAME}`
    const description = clampDescription(
      category.description || `Watch ${category.name} portrait videos on ${SITE_NAME}.`
    )
    const canonical = absoluteUrl(`/category/${slug}`)

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

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  void params
  return <VertApp />
}
