'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface VideoShelfProps {
  title: string
  children: React.ReactNode
  onSeeAll?: () => void
  /** Optional icon rendered before the title (e.g. <Sparkles /> for "For You"). */
  icon?: React.ReactNode
}

export function VideoShelf({ title, children, onSeeAll, icon }: VideoShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10)
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = scrollRef.current.clientWidth * 0.75
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
          {icon}
          {title}
        </h2>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-sm text-violet-600 hover:text-violet-700 transition-colors flex items-center gap-0.5"
          >
            See all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="relative group/shelf">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-8 z-10 w-10 bg-gradient-to-r from-white dark:from-zinc-950 to-transparent flex items-center justify-start pl-1 opacity-0 group-hover/shelf:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
              <ChevronLeft className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
            </div>
          </button>
        )}

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 overflow-x-auto shelf-scroll pb-2"
        >
          {children}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-8 z-10 w-10 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent flex items-center justify-end pr-1 opacity-0 group-hover/shelf:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
              <ChevronRight className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
