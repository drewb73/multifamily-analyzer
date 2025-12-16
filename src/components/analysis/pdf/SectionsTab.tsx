// src/components/analysis/pdf/SectionsTab.tsx
'use client'

import { PDFSectionConfig } from '@/types/pdf'
import { SectionCheckbox } from './SectionCheckbox'

interface SectionsTabProps {
  sections: PDFSectionConfig[]
  includeCharts: boolean
  includeNotes: boolean
  blackAndWhite: boolean
  onSectionToggle: (sectionId: string, enabled: boolean) => void
  onOptionToggle: (option: 'includeCharts' | 'includeNotes' | 'blackAndWhite', value: boolean) => void
  estimatedPages: number
  estimatedSize: string
}

export function SectionsTab({
  sections,
  includeCharts,
  includeNotes,
  blackAndWhite,
  onSectionToggle,
  onOptionToggle,
  estimatedPages,
  estimatedSize
}: SectionsTabProps) {
  // No filtering needed - sections array is already filtered by createDefaultSections
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

      {/* Sections Grid */}
      <div className="space-y-3">
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
          {/* Include Charts */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={includeCharts}
              onChange={(e) => onOptionToggle('includeCharts', e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-2 border-neutral-300 text-primary-600 
                         focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium text-neutral-900 group-hover:text-neutral-700">
                Include charts and graphs
              </div>
              <div className="text-sm text-neutral-600">
                Visual representations of income, expenses, and returns
              </div>
            </div>
          </label>

          {/* Include Notes */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={includeNotes}
              onChange={(e) => onOptionToggle('includeNotes', e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-2 border-neutral-300 text-primary-600 
                         focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium text-neutral-900 group-hover:text-neutral-700">
                Include notes section
              </div>
              <div className="text-sm text-neutral-600">
                Add a blank notes page for additional comments
              </div>
            </div>
          </label>

          {/* Black & White Mode */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={blackAndWhite}
              onChange={(e) => onOptionToggle('blackAndWhite', e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-2 border-neutral-300 text-primary-600 
                         focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium text-neutral-900 group-hover:text-neutral-700">
                Black & White (printer-friendly)
              </div>
              <div className="text-sm text-neutral-600">
                Optimized for printing without color ink
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-200" />

      {/* Info Footer */}
      <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-neutral-700">
              Sections selected:
            </span>
            <span className="text-sm font-semibold text-neutral-900">
              {enabledSections.length} of {visibleSections.length}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-neutral-700">
              Estimated pages:
            </span>
            <span className="text-sm font-semibold text-neutral-900">
              {estimatedPages} {estimatedPages === 1 ? 'page' : 'pages'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-neutral-700">
              Estimated file size:
            </span>
            <span className="text-sm font-semibold text-neutral-900">
              ~{estimatedSize} MB
            </span>
          </div>
        </div>

        {/* Tip */}
        <div className="mt-3 pt-3 border-t border-neutral-200">
          <div className="flex gap-2 text-xs text-neutral-600">
            <span>💡</span>
            <span>
              Tip: Include all sections for a comprehensive report, or select specific sections for a focused analysis.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}