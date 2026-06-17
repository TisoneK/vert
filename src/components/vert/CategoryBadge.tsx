'use client'

export function CategoryBadge({ categories, max = 2 }: { categories: Array<{ name: string; slug: string }>; max?: number }) {
  if (!categories || categories.length === 0) return null

  const visible = categories.slice(0, max)
  const remaining = categories.length - max

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {visible.map((cat) => (
        <span
          key={cat.slug}
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600"
        >
          {cat.name}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-50 text-zinc-600">
          +{remaining}
        </span>
      )}
    </div>
  )
}
