'use client'

import Image from 'next/image'
import { useState, useCallback } from 'react'
import { Play } from 'lucide-react'

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
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
        <Play className={`${iconClassName} text-zinc-400 dark:text-zinc-500`} />
      </div>
    )
  }

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-zinc-200 dark:bg-zinc-800" aria-hidden />
      )}
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        className={`object-cover transition duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
      />
    </>
  )
}
