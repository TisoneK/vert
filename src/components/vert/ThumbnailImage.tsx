'use client'

import Image from 'next/image'
import { useState, useCallback } from 'react'
import { ThumbnailFallback } from './ThumbnailFallback'

/**
 * Thumbnail image with a built-in loading skeleton + fade-in and an onError
 * fallback. Removes the "flash of empty gray box" on card grids (review [P1]).
 *
 * Must be placed inside a `relative` aspect-ratio container (it uses
 * `next/image` `fill`); the caller owns the container's size, rounding, and
 * background.
 */
export function ThumbnailImage({
  src,
  alt,
  sizes,
  iconClassName = 'h-6 w-6',
  imgClassName = '',
}: {
  src: string | null | undefined
  alt: string
  sizes: string
  iconClassName?: string
  imgClassName?: string
}) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const show = src && !failed

  // Cached images can already be `complete` before React attaches `onLoad`,
  // which would leave them stuck at opacity-0. Mark loaded on mount in that case.
  const imgRef = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth > 0) setLoaded(true)
  }, [])

  if (!show) {
    return <ThumbnailFallback seed={alt} iconClassName={iconClassName} />
  }

  // The gradient fallback doubles as the loading underlay BEHIND an
  // always-visible image. The <img> is transparent until the browser paints
  // its pixels, so the branded gradient poster shows through while loading and
  // the image paints over it when ready — with no dependency on `onLoad`
  // firing. (An opacity-0-until-onLoad approach leaves the thumbnail stuck
  // invisible whenever the load event doesn't fire — e.g. a throttled/
  // background tab or a bfcache restore.) `onLoad`/`ref` here only remove the
  // now-covered poster for cleanliness.
  return (
    <>
      {!loaded && <ThumbnailFallback seed={alt} iconClassName={iconClassName} loading />}
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        className={`object-cover ${imgClassName}`}
      />
    </>
  )
}
