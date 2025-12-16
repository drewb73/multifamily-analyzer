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
    <div 
      className={`
        border rounded-lg p-4
        transition-all duration-200
        ${checked 
          ? 'bg-primary-50 border-primary-200' 
          : 'bg-white border-neutral-200 hover:border-neutral-300'
        }
        ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onClick={() => {
        if (!isDisabled) {
          onChange(section.id, !checked)
        }
      }}
    >
      <div className="flex items-start gap-3">
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
          onClick={(e) => e.stopPropagation()}
          className={`
            w-5 h-5 mt-0.5 rounded
            border-2 border-neutral-300
            text-primary-600 
            focus:ring-2 focus:ring-primary-500 focus:ring-offset-0
            transition-colors
            ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Icon */}
            <span className="text-xl">{section.icon}</span>
            
            {/* Label */}
            <h4 className="font-semibold text-neutral-900">
              {section.label}
            </h4>

            {/* Badges */}
            {section.required && (
              <span className="px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600 rounded">
                Required
              </span>
            )}
            
            {section.comingSoon && (
              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">
                Coming Soon
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-neutral-600 leading-relaxed">
            {section.description}
          </p>

          {/* Estimated Pages */}
          {checked && (
            <div className="mt-2 text-xs text-neutral-500">
              ~{section.estimatedPages} {section.estimatedPages === 1 ? 'page' : 'pages'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}