import type { MetadataRoute } from 'next'
import { absoluteUrl, SITE_URL } from '@/lib/site-metadata'

/**
 * Dynamic robots.txt — supersedes the former static public/robots.txt so the
 * sitemap reference always points at the correct origin (production vs preview)
 * and stays in sync with app/sitemap.ts. See ADR-25.
 *
 * Account-state and API surfaces are disallowed: they carry no crawlable public
 * content and only waste crawl budget.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin', '/settings', '/upload', '/creator-studio', '/history', '/saved', '/profile'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  }
}
