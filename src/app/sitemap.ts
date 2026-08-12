import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { absoluteUrl } from '@/lib/site-metadata'

/**
 * Dynamic sitemap — lists the public, crawlable surfaces so search engines can
 * discover content behind the client-navigated SPA (which has no crawlable
 * <a> links to follow on its own until ADR-26 lands). See ADR-25.
 *
 * Resilient by design: a DB hiccup must still yield a valid sitemap, so the
 * static routes are always returned and each content query is guarded.
 */

// Cap per entity type — well under the 50k-URL sitemap limit, and avoids
// an unbounded scan as the catalog grows. Newest first.
const MAX_PER_TYPE = 5000

export const revalidate = 3600 // regenerate at most hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/trending'), lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: absoluteUrl('/explore'), lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: absoluteUrl('/changelog'), lastModified: now, changeFrequency: 'weekly', priority: 0.3 },
    { url: absoluteUrl('/contact'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: absoluteUrl('/terms'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: absoluteUrl('/privacy'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const [videos, channels, categories, tags] = await Promise.all([
    db.video
      .findMany({
        where: { isRemoved: false },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: MAX_PER_TYPE,
      })
      .catch(() => []),
    db.channel
      .findMany({
        where: { isSuspended: false },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: MAX_PER_TYPE,
      })
      .catch(() => []),
    db.category.findMany({ select: { slug: true } }).catch(() => []),
    db.tag
      .findMany({
        select: { name: true },
        orderBy: { usageCount: 'desc' },
        take: MAX_PER_TYPE,
      })
      .catch(() => []),
  ])

  return [
    ...staticRoutes,
    ...videos.map((v) => ({
      url: absoluteUrl(`/watch/${v.id}`),
      lastModified: v.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...channels.map((c) => ({
      url: absoluteUrl(`/channel/${c.id}`),
      lastModified: c.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...categories.map((c) => ({
      url: absoluteUrl(`/category/${c.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),
    ...tags.map((t) => ({
      url: absoluteUrl(`/tag/${t.name}`),
      changeFrequency: 'weekly' as const,
      priority: 0.3,
    })),
  ]
}
