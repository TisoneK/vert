import type { Metadata } from 'next'
import { VertApp } from '@/components/vert/VertApp'
import { db } from '@/lib/db'
import { SITE_NAME, absoluteUrl, clampDescription, FALLBACK_METADATA } from '@/lib/site-metadata'

/**
 * /channel/[id] — deep-linkable channel page. Server component so it can emit
 * per-channel metadata; interactive view renders in <VertApp/>. See ADR-25.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  try {
    const channel = await db.channel.findUnique({
      where: { id },
      select: {
        channelName: true,
        description: true,
        bannerUrl: true,
        isSuspended: true,
        user: { select: { avatarUrl: true } },
      },
    })

    if (!channel || channel.isSuspended) return FALLBACK_METADATA

    const title = `${channel.channelName} · ${SITE_NAME}`
    const description = clampDescription(
      channel.description || `${channel.channelName}'s channel on ${SITE_NAME}.`
    )
    const canonical = absoluteUrl(`/channel/${id}`)
    const image = channel.bannerUrl || channel.user.avatarUrl
    const images = image ? [{ url: image }] : undefined

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        type: 'profile',
        url: canonical,
        siteName: SITE_NAME,
        images,
      },
      twitter: {
        card: images ? 'summary_large_image' : 'summary',
        title,
        description,
        images: image ? [image] : undefined,
      },
    }
  } catch {
    return FALLBACK_METADATA
  }
}

export default function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  void params
  return <VertApp />
}
