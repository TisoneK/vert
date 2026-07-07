'use client'

import { Search, TrendingUp, Clock } from 'lucide-react'

interface SearchSuggestionsProps {
  query: string
  onSelect: (suggestion: string) => void
  recentSearches?: string[]
}

const trendingSuggestions = [
  'Trending now',
  'Music videos',
  'Tech reviews',
  'Gaming highlights',
  'Sports recap',
  'Cooking tutorials',
]

export function SearchSuggestions({ query, onSelect, recentSearches = [] }: SearchSuggestionsProps) {
  const filteredTrending = query
    ? trendingSuggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : trendingSuggestions

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl py-2 z-50">
      {recentSearches.length > 0 && (
        <>
          <p className="px-4 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> Recent
          </p>
          {recentSearches.map((s) => (
            <button
              key={`recent-${s}`}
              onClick={() => onSelect(s)}
              className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <Clock className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
              {s}
            </button>
          ))}
          <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
        </>
      )}
      <p className="px-4 py-1.5 text-xs font-medium text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
        <TrendingUp className="h-3 w-3" /> Trending
      </p>
      {filteredTrending.map((s) => (
        <button
          key={`trending-${s}`}
          onClick={() => onSelect(s)}
          className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
        >
          <Search className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
          {s}
        </button>
      ))}
    </div>
  )
}
