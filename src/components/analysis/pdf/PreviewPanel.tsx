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
  inputs?: any      // ADD THIS
  results?: any     // ADD THIS
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
  inputs,     // ADD THIS
  results     // ADD THIS
}: PreviewPanelProps) {
  const [zoom, setZoom] = useState(75)

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 150))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50))
  }

  const handleZoomReset = () => {
    setZoom(75)
  }

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b flex-shrink-0">
        <h3 className="text-lg font-semibold text-neutral-900">
          Live Preview
        </h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-neutral-600" />
          </button>
          
          <button
            onClick={handleZoomReset}
            className="px-3 py-1.5 text-sm font-medium border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            {zoom}%
          </button>
          
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 150}
            className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-neutral-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="flex justify-center">
          <div 
            className="transition-transform duration-200 origin-top"
            style={{ 
              transform: `scale(${zoom / 100})`,
              width: `${(100 / zoom) * 100}%`
            }}
          >
            <PDFTemplatePreview
              propertyName={propertyName}
              sections={sections}
              contactInfo={contactInfo}
              colors={colors}
              includeCharts={includeCharts}
              includeNotes={includeNotes}
              blackAndWhite={blackAndWhite}
              estimatedPages={estimatedPages}
              inputs={inputs}      // ADD THIS
              results={results}    // ADD THIS
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-3 bg-white border-t flex-shrink-0">
        <div className="flex items-center justify-center gap-2 text-sm text-neutral-600">
          <span>💡</span>
          <span>Changes update in real-time as you customize</span>
        </div>
      </div>
    </div>
  )
}