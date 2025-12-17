// src/components/analysis/pdf/PDFTemplatePreview.tsx
'use client'

import { PDFSectionConfig, ContactInfo, BrandingColors } from '@/types/pdf'
import { PDFHeader } from './PDFHeader'
import { PDFFooter } from './PDFFooter'

interface PDFTemplatePreviewProps {
  propertyName: string
  sections: PDFSectionConfig[]
  contactInfo: ContactInfo
  colors: BrandingColors
  includeCharts: boolean
  includeNotes: boolean
  blackAndWhite: boolean
  estimatedPages: number
}

export function PDFTemplatePreview({
  propertyName,
  sections,
  contactInfo,
  colors,
  includeCharts,
  includeNotes,
  blackAndWhite,
  estimatedPages
}: PDFTemplatePreviewProps) {
  // Get enabled sections
  const enabledSections = sections.filter(s => s.enabled)

  // Determine if contact info should show in header/footer
  const showInHeader = contactInfo.position === 'header' || contactInfo.position === 'both'
  const showInFooter = contactInfo.position === 'footer' || contactInfo.position === 'both'

  return (
    <div className="pdf-template-preview bg-white shadow-xl rounded-lg overflow-hidden">
      {/* Header */}
      <PDFHeader
        propertyName={propertyName}
        contactInfo={contactInfo}
        colors={colors}
        showContact={showInHeader}
      />

      {/* Content */}
      <div className="p-8 space-y-6 min-h-[400px]">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Property Analysis Report
          </h2>
          <p className="text-neutral-600">
            {propertyName}
          </p>
        </div>

        {/* Sections Preview */}
        <div className="space-y-4">
          {enabledSections.length > 0 ? (
            enabledSections.map((section) => (
              <div 
                key={section.id}
                className="border-l-4 pl-4 py-2"
                style={{ 
                  borderColor: blackAndWhite ? '#6B7280' : colors.accentColor 
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{section.icon}</span>
                  <h3 className="font-semibold text-neutral-900">
                    {section.label}
                  </h3>
                </div>
                <p className="text-sm text-neutral-600">
                  {section.description}
                </p>
                {includeCharts && section.id !== 'property' && (
                  <div className="mt-2 text-xs text-neutral-500 italic">
                    + Charts and graphs
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-neutral-400">
              <p>No sections selected</p>
              <p className="text-sm mt-2">
                Select sections from the "Sections" tab
              </p>
            </div>
          )}

          {/* Additional Options Preview */}
          {includeNotes && (
            <div 
              className="border-l-4 pl-4 py-2"
              style={{ 
                borderColor: blackAndWhite ? '#6B7280' : colors.accentColor 
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">📝</span>
                <h3 className="font-semibold text-neutral-900">
                  Notes Section
                </h3>
              </div>
              <p className="text-sm text-neutral-600">
                Blank page for additional comments and notes
              </p>
            </div>
          )}
        </div>

        {/* Color Mode Indicator */}
        {blackAndWhite && (
          <div className="mt-6 p-3 bg-neutral-100 rounded-lg border border-neutral-200">
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <span>🖨️</span>
              <span className="font-medium">
                Black & White Mode - Optimized for printing
              </span>
            </div>
          </div>
        )}

        {/* Page Count Info */}
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <div className="text-center text-sm text-neutral-600">
            <p>
              <span className="font-semibold text-neutral-900">
                {estimatedPages}
              </span>
              {' '}
              {estimatedPages === 1 ? 'page' : 'pages'} estimated
            </p>
            <p className="text-xs mt-1">
              {enabledSections.length} section{enabledSections.length !== 1 ? 's' : ''} included
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <PDFFooter
        contactInfo={contactInfo}
        colors={colors}
        showContact={showInFooter}
        pageNumber={1}
        totalPages={estimatedPages}
      />
    </div>
  )
}