// src/components/analysis/pdf/PDFGeneratingOverlay.tsx
'use client'

import { Loader2, FileText } from 'lucide-react'

interface PDFGeneratingOverlayProps {
  isGenerating: boolean
}

export function PDFGeneratingOverlay({ isGenerating }: PDFGeneratingOverlayProps) {
  if (!isGenerating) return null

  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Icon */}
        <div className="relative mb-6">
          <FileText className="w-20 h-20 text-primary-500 mx-auto" />
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Text */}
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">
          Generating Your PDF
        </h3>
        <p className="text-neutral-600 mb-6">
          Please wait while we create your property analysis report...
        </p>

        {/* Progress Indicator */}
        <div className="w-64 h-2 bg-neutral-200 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full animate-pulse" 
               style={{ width: '100%' }} />
        </div>

        {/* Tip */}
        <p className="text-sm text-neutral-500 mt-6">
          Your download will start automatically when ready
        </p>
      </div>
    </div>
  )
}