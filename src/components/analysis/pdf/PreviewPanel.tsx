// src/components/analysis/pdf/PreviewPanel.tsx
'use client'

import { useState } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { PDFTemplatePreview } from './PDFTemplatePreview'
import { PDFSectionConfig, ContactInfo, BrandingColors } from '@/types/pdf'

interface PreviewPanelProps {
  propertyName: string
  sections: PDFSectionConfig[]
  contactInfo: ContactInfo
  colors: BrandingColors
  includeCharts: boolean
  includeNotes: boolean
  blackAndWhite: boolean
  estimatedPages: number
  inputs?: any
  results?: any
  pdfRef?: React.RefObject<HTMLDivElement | null>
}

export function PreviewPanel({
  propertyName,
  sections,
  contactInfo,
  colors,
  includeCharts,
  includeNotes,
  blackAndWhite,
  estimatedPages,
  inputs,
  results,
  pdfRef
}: PreviewPanelProps) {
  // LOCK ZOOM AT 100% - Don't allow user to change
  const [zoom] = useState(100)

  // Remove zoom handlers since user can't change zoom
  // const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 150))
  // const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))
  // const handleZoomReset = () => setZoom(100)

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      {/* Header - Zoom controls removed */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b flex-shrink-0">
        <h3 className="text-lg font-semibold text-neutral-900">
          Live Preview
        </h3>
        
        {/* Show scale info instead of controls */}
        <span className="text-sm text-neutral-500">
          100% Scale (Actual Size)
        </span>
      </div>

      {/* Scrollable Preview Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex justify-center">
          <div 
            className="transition-transform duration-200 origin-top"
            style={{ 
              transform: `scale(${zoom / 100})`,
              width: `${(100 / zoom) * 100}%`
            }}
          >
            {/* This is the actual PDF content that will be captured */}
            <div ref={pdfRef} data-pdf-content>
              <PDFTemplatePreview
                propertyName={propertyName}
                sections={sections}
                contactInfo={contactInfo}
                colors={colors}
                includeCharts={includeCharts}
                includeNotes={includeNotes}
                blackAndWhite={blackAndWhite}
                estimatedPages={estimatedPages}
                inputs={inputs}
                results={results}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}