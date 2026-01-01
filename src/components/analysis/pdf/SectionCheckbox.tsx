// src/components/analysis/pdf/SectionCheckbox.tsx
'use client'

import { PDFSectionConfig } from '@/types/pdf'

interface SectionCheckboxProps {
  section: PDFSectionConfig
  checked: boolean
  onChange: (sectionId: string, checked: boolean) => void
  disabled?: boolean
}

export function SectionCheckbox({ 
  section, 
  checked, 
  onChange,
  disabled = false 
}: SectionCheckboxProps) {
  const isDisabled = disabled || section.required

  return (
    <label 
      className={`
        flex items-center gap-3 p-3 rounded-lg
        transition-all duration-200 cursor-pointer
        ${checked 
          ? 'bg-primary-50 border border-primary-200' 
          : 'bg-white border border-neutral-200 hover:border-neutral-300'
        }
        ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}
      `}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          if (!isDisabled) {
            onChange(section.id, e.target.checked)
          }
        }}
        disabled={isDisabled}
        className={`
          w-4 h-4 rounded
          border-2 border-neutral-300
          text-primary-600 
          focus:ring-2 focus:ring-primary-500 focus:ring-offset-0
          transition-colors
          ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      />

      {/* Icon */}
      <span className="text-lg">{section.icon}</span>
      
      {/* Label & Description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-900 text-sm">
            {section.label}
          </span>

          {/* Badges */}
          {section.required && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600 rounded">
              Required
            </span>
          )}
          
          {section.comingSoon && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">
              Coming Soon
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">
          {section.description}
        </p>
      </div>
    </label>
  )
}