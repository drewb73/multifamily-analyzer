// src/components/analysis/pdf/SectionsTab.tsx
'use client'

import { PDFSectionConfig } from '@/types/pdf'
import { SectionCheckbox } from './SectionCheckbox'

interface SectionsTabProps {
  sections: PDFSectionConfig[]
  blackAndWhite: boolean
  onSectionToggle: (sectionId: string, enabled: boolean) => void
  onOptionToggle: (option: 'blackAndWhite', value: boolean) => void
}

export function SectionsTab({
  sections,
  blackAndWhite,
  onSectionToggle,
  onOptionToggle,
}: SectionsTabProps) {
  const visibleSections = sections
  const enabledSections = sections.filter(s => s.enabled)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Select Sections to Include
        </h3>
        <p className="text-sm text-neutral-600">
          Choose which sections to include in your PDF report
        </p>
      </div>

      {/* Sections List */}
      <div className="space-y-2">
        {visibleSections.map((section) => (
          <SectionCheckbox
            key={section.id}
            section={section}
            checked={section.enabled}
            onChange={onSectionToggle}
            disabled={section.comingSoon}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-200" />

      {/* Additional Options */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Additional Options
        </h3>
        
        <div className="space-y-3">
          {/* Black & White Mode */}
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors">
            <input
              type="checkbox"
              checked={blackAndWhite}
              onChange={(e) => onOptionToggle('blackAndWhite', e.target.checked)}
              className="w-4 h-4 rounded border-2 border-neutral-300 text-primary-600 
                         focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium text-neutral-900 text-sm">
                Black & White (printer-friendly)
              </div>
              <div className="text-xs text-neutral-500">
                Removes colors for professional printing
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-neutral-700">
            Sections selected:
          </span>
          <span className="text-sm font-semibold text-neutral-900">
            {enabledSections.length} of {visibleSections.length}
          </span>
        </div>
      </div>
    </div>
  )
}