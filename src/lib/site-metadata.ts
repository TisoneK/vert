import type { Metadata } from 'next'

/**
 * Canonical site origin, used to build absolute URLs for OpenGraph/Twitter
 * cards, canonical links, and the sitemap.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL — explicit override (set this for a custom domain).
 *   2. VERCEL_PROJECT_PRODUCTION_URL — set by Vercel to the production domain
 *      (no protocol), so previews still point at the canonical production URL.
 *   3. The current known production URL as a last-resort fallback.
 *
 * Kept as a plain https origin with no trailing slash.
 */
export const SITE_URL: string = (() => {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`
  return 'https://vert-wine.vercel.app'
})()

/** Site-wide defaults, reused by the root layout and as metadata fallbacks. */
export const SITE_NAME = 'Vert'
export const SITE_DESCRIPTION = 'Watch and share portrait video.'

/** Join the site origin with a path, producing an absolute URL. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

/**
 * Metadata used when a content lookup fails or the entity is missing/removed.
 * Falling back to the site defaults (rather than throwing) keeps a shared link
 * rendering a valid card even if the DB is briefly unreachable.
 */
export const FALLBACK_METADATA: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
  },
  twitter: { card: 'summary', title: SITE_NAME, description: SITE_DESCRIPTION },
}

/** Truncate a description to a social-card-friendly length on a word boundary. */
export function clampDescription(text: string | null | undefined, max = 160): string {
  const t = (text ?? '').trim()
  if (!t) return SITE_DESCRIPTION
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}
