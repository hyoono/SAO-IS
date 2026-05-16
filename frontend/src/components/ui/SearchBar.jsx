import { useState, useEffect } from 'react'

/**
 * Debounced search input that fires onSearch callback after 300ms of inactivity.
 */
export default function SearchBar({ onSearch, placeholder = 'Search...' }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, onSearch])

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--th-text-muted)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        id="search-bar"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-[var(--th-surface)] border border-[var(--th-border)] rounded-lg text-[var(--th-text)] placeholder-[var(--th-text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
      />
    </div>
  )
}
