import { Play } from 'lucide-react'

/**
 * Branded placeholder shown when a video has no thumbnail (null) or its
 * thumbnail fails to load. Replaces the flat gray "broken image" box — which
 * made whole grids read as unfinished — with an intentional gradient poster +
 * a frosted play button, so a feed of thumbnail-less videos still looks like a
 * designed product. The gradient is picked deterministically from a seed
 * (the video title), so each card gets a stable, distinct colour and the feed
 * reads as varied real content rather than a wall of identical gray.
 *
 * Self-coloured, so it needs no light/dark variants. Place inside a `relative`
 * aspect-ratio container (it fills via `absolute inset-0`).
 */

// Curated, hand-tuned gradient pairs (not raw HSL math) so every placeholder
// lands on a tasteful colour instead of an occasional muddy one.
const GRADIENTS: ReadonlyArray<readonly [string, string]> = [
  ['#7c3aed', '#4f46e5'], // violet → indigo (brand-leaning)
  ['#e11d48', '#f97316'], // rose → orange
  ['#0ea5e9', '#06b6d4'], // sky → cyan
  ['#10b981', '#0d9488'], // emerald → teal
  ['#f59e0b', '#e11d48'], // amber → rose
  ['#d946ef', '#9333ea'], // fuchsia → purple
  ['#3b82f6', '#7c3aed'], // blue → violet
  ['#0d9488', '#15803d'], // teal → green
]

function pickGradient(seed: string): readonly [string, string] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return GRADIENTS[Math.abs(h) % GRADIENTS.length]
}

export function ThumbnailFallback({
  seed,
  iconClassName = 'h-8 w-8',
}: {
  seed: string
  iconClassName?: string
}) {
  const [from, to] = pickGradient(seed || 'vert')
  return (
    <div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden
    >
      {/* soft top-left highlight for a sense of depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_60%)]" />
      <div className="relative flex items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur-sm p-3">
        <Play className={`${iconClassName} text-white fill-white`} />
      </div>
    </div>
  )
}
