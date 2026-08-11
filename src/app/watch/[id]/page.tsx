import type { Metadata } from 'next'
import { VertApp } from '@/components/vert/VertApp'
import { db } from '@/lib/db'
import {
  SITE_NAME,
  absoluteUrl,
  clampDescription,
  FALLBACK_METADATA,
} from '@/lib/site-metadata'

/**
 * /watch/[id] — deep-linkable, shareable video page.
 *
 * This is a SERVER component so it can export `generateMetadata`: shared links
 * (iMessage/WhatsApp/Slack/X) and crawlers read the initial server HTML, not the
 * post-hydration DOM, so per-video OpenGraph/Twitter tags must be emitted here.
 * The interactive view still renders inside the client <VertApp/>, which parses
 * window.location and drives the Zustand navigation store. See .context ADR-25.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  try {
    const video = await db.video.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        thumbnailUrl: true,
        videoUrl: true,
        isRemoved: true,
        channel: { select: { channelName: true } },
      },
    })

    if (!video || video.isRemoved) return FALLBACK_METADATA

    const title = `${video.title} · ${video.channel.channelName}`
    const description = clampDescription(
      video.description || `${video.title} — watch on ${SITE_NAME}.`
    )
    const canonical = absoluteUrl(`/watch/${id}`)
    const images = video.thumbnailUrl ? [{ url: video.thumbnailUrl }] : undefined

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        type: 'video.other',
        url: canonical,
        siteName: SITE_NAME,
        images,
        videos: video.videoUrl ? [{ url: video.videoUrl }] : undefined,
      },
      twitter: {
        card: images ? 'summary_large_image' : 'summary',
        title,
        description,
        images: video.thumbnailUrl ? [video.thumbnailUrl] : undefined,
      },
    }
  } catch {
    // A DB hiccup must not 500 the page — fall back to valid site-level tags.
    return FALLBACK_METADATA
  }
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  // VertApp parses window.location directly; we await params only so Next
  // treats this as a dynamic route.
  void params
  return <VertApp />
}
