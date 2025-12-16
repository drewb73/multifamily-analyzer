// src/components/dashboard/SearchBar.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  debounceMs?: number
}

export function SearchBar({ 
  onSearch, 
  placeholder = 'Search analyses...',
  debounceMs = 500 
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer for debounced search
    debounceTimerRef.current = setTimeout(() => {
      onSearch(searchQuery)
    }, debounceMs)

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, onSearch, debounceMs])

  const handleClear = () => {
    setSearchQuery('')
    onSearch('')
  }

  return (
    <div className="relative">
      {/* Search Icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Search className="w-5 h-5 text-neutral-400" />
      </div>

      {/* Search Input */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 border border-neutral-300 rounded-lg 
                   focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                   text-neutral-900 placeholder-neutral-400
                   transition-colors"
      />

      {/* Clear Button */}
      {searchQuery && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 
                     text-neutral-400 hover:text-neutral-600 
                     transition-colors p-1 rounded-full hover:bg-neutral-100"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}