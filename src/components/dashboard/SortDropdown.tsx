// src/components/dashboard/SortDropdown.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ArrowUpDown } from 'lucide-react'

export type SortOption = {
  value: string
  label: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest First', sortBy: 'createdAt', sortOrder: 'desc' },
  { value: 'oldest', label: 'Oldest First', sortBy: 'createdAt', sortOrder: 'asc' },
  { value: 'name-asc', label: 'Name (A-Z)', sortBy: 'name', sortOrder: 'asc' },
  { value: 'name-desc', label: 'Name (Z-A)', sortBy: 'name', sortOrder: 'desc' },
  { value: 'price-high', label: 'Price (High to Low)', sortBy: 'purchasePrice', sortOrder: 'desc' },
  { value: 'price-low', label: 'Price (Low to High)', sortBy: 'purchasePrice', sortOrder: 'asc' },
  { value: 'caprate-high', label: 'Cap Rate (High to Low)', sortBy: 'capRate', sortOrder: 'desc' },
  { value: 'caprate-low', label: 'Cap Rate (Low to High)', sortBy: 'capRate', sortOrder: 'asc' },
  { value: 'cashflow-high', label: 'Cash Flow (High to Low)', sortBy: 'cashFlow', sortOrder: 'desc' },
  { value: 'cashflow-low', label: 'Cash Flow (Low to High)', sortBy: 'cashFlow', sortOrder: 'asc' },
  { value: 'units-high', label: 'Units (High to Low)', sortBy: 'totalUnits', sortOrder: 'desc' },
  { value: 'units-low', label: 'Units (Low to High)', sortBy: 'totalUnits', sortOrder: 'asc' },
]

interface SortDropdownProps {
  value: string
  onChange: (option: SortOption) => void
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const currentOption = SORT_OPTIONS.find(opt => opt.value === value) || SORT_OPTIONS[0]

  const handleSelect = (option: SortOption) => {
    onChange(option)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border border-neutral-300 rounded-lg 
                   bg-white hover:bg-neutral-50 transition-colors text-sm"
      >
        <ArrowUpDown className="w-4 h-4 text-neutral-500" />
        <span className="text-neutral-700">Sort: {currentOption.label}</span>
        <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-20 min-w-[220px] max-h-[400px] overflow-y-auto">
          {SORT_OPTIONS.map((option) => {
            const isSelected = option.value === value

            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`
                  w-full px-3 py-2 text-left text-sm flex items-center justify-between
                  hover:bg-neutral-50 transition-colors
                  ${isSelected ? 'bg-primary-50 text-primary-700 font-medium' : 'text-neutral-700'}
                `}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}