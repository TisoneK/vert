'use client'

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {/* aspect-[9/16] matches VideoCard's default portrait shape, so the
          layout doesn't jump when real (mostly portrait) cards replace the
          skeletons. */}
      <div className="aspect-[9/16] bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
      <div className="mt-2 flex gap-2">
        <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-4/5" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-3/5" />
          <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded w-2/5" />
        </div>
      </div>
    </div>
  )
}

export function HeroCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
      <div className="mt-3 space-y-2">
        <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
      </div>
    </div>
  )
}

export function TextSkeleton({ lines = 2, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

export function AvatarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8'
  return <div className={`animate-pulse ${sizeClass} rounded-full bg-zinc-200 dark:bg-zinc-700`} />
}

export function ShelfSkeleton() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-32 animate-pulse" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16 animate-pulse" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="shrink-0 w-[220px] animate-pulse">
            <div className="aspect-video bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
            <div className="mt-2 space-y-1.5">
              <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-4/5" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-3/5" />
              <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CommentSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-24" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
      </div>
    </div>
  )
}

export function RelatedVideoSkeleton() {
  return (
    <div className="flex gap-2 animate-pulse">
      <div className="w-32 h-[72px] bg-zinc-200 dark:bg-zinc-700 rounded shrink-0" />
      <div className="flex-1 space-y-1.5 py-0.5">
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
        <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
        <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
      </div>
    </div>
  )
}
