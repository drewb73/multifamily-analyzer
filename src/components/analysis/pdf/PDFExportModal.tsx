// src/components/analysis/pdf/PDFExportModal.tsx
// UPDATED FOR PHASE 2 - Replace the existing file with this

'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { PDFExportState, PDFTabType } from '@/types/pdf'
import { TabNavigation } from './TabNavigation'
import { SectionsTab } from './SectionsTab'
import { createDefaultSections } from './defaultSections'

interface PDFExportModalProps {
  isOpen: boolean
  onClose: () => void
  propertyName: string
  userName?: string
  userEmail?: string
  isCashPurchase?: boolean
  hasMarketAnalysis?: boolean
}

export function PDFExportModal({
  isOpen,
  onClose,
  propertyName,
  userName = '',
  userEmail = '',
  isCashPurchase = false,
  hasMarketAnalysis = false,
}: PDFExportModalProps) {
  // Initialize state with defaults
  const [pdfState, setPDFState] = useState<PDFExportState>({
    // Initialize sections based on property type
    sections: createDefaultSections(isCashPurchase, hasMarketAnalysis),
    
    // Options
    includeCharts: true,
    includeNotes: true,
    blackAndWhite: false,
    
    // Contact & Branding
    contactInfo: {
      name: userName,
      email: userEmail,
      phone: '',
      showName: true,
      showEmail: true,
      showPhone: false,
      position: 'footer'
    },
    colors: {
      headerFooterBg: '#1E40AF',
      headerFooterText: '#FFFFFF',
      accentColor: '#3B82F6'
    },
    
    // UI State
    activeTab: 'sections',
    previewZoom: 75,
    isGenerating: false,
    estimatedPages: 0,
    estimatedSize: '0',
    showMobilePreview: false
  })

  // Calculate estimated pages and file size whenever sections or options change
  useEffect(() => {
    const enabledSections = pdfState.sections.filter(s => s.enabled)
    const totalPages = enabledSections.reduce((sum, s) => sum + s.estimatedPages, 0)
    
    // Add extra pages for options
    let adjustedPages = totalPages
    if (pdfState.includeCharts) adjustedPages += 0.5
    if (pdfState.includeNotes) adjustedPages += 1
    
    // Round up to nearest page
    const estimatedPages = Math.ceil(adjustedPages)
    
    // Estimate file size (rough calculation)
    // Base: 0.5 MB per page, charts add 0.3 MB each
    let sizeInMB = estimatedPages * 0.5
    if (pdfState.includeCharts) {
      const chartsCount = enabledSections.length * 0.5 // Rough estimate
      sizeInMB += chartsCount * 0.3
    }
    
    setPDFState(prev => ({
      ...prev,
      estimatedPages,
      estimatedSize: sizeInMB.toFixed(1)
    }))
  }, [pdfState.sections, pdfState.includeCharts, pdfState.includeNotes])

  // Handle tab change
  const handleTabChange = (tab: PDFTabType) => {
    setPDFState(prev => ({ ...prev, activeTab: tab }))
  }

  // Handle section toggle
  const handleSectionToggle = (sectionId: string, enabled: boolean) => {
    setPDFState(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, enabled }
          : section
      )
    }))
  }

  // Handle option toggle
  const handleOptionToggle = (
    option: 'includeCharts' | 'includeNotes' | 'blackAndWhite',
    value: boolean
  ) => {
    setPDFState(prev => ({
      ...prev,
      [option]: value
    }))
  }

  // Handle close
  const handleClose = () => {
    if (pdfState.isGenerating) return
    onClose()
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !pdfState.isGenerating) {
        handleClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, pdfState.isGenerating])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="
            bg-white rounded-xl shadow-2xl
            w-full max-w-7xl
            max-h-[90vh]
            flex flex-col
            animate-in fade-in zoom-in duration-200
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="
            flex items-center justify-between
            px-6 py-4 border-b
            flex-shrink-0
          ">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">
                Customize Your PDF Export
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                {propertyName}
              </p>
            </div>
            
            <button
              onClick={handleClose}
              disabled={pdfState.isGenerating}
              className="
                p-2 rounded-lg
                hover:bg-neutral-100
                transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-neutral-500" />
            </button>
          </div>

          {/* Content Area - Split Layout */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            
            {/* LEFT SIDE - Customization Panel (Desktop & Tablet) */}
            <div className="
              hidden lg:flex lg:flex-col
              lg:w-[45%] border-r
              overflow-hidden
            ">
              {/* Tab Navigation */}
              <div className="px-6 pt-4 flex-shrink-0">
                <TabNavigation
                  activeTab={pdfState.activeTab}
                  onTabChange={handleTabChange}
                />
              </div>

              {/* Tab Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {pdfState.activeTab === 'sections' && (
                  <SectionsTab
                    sections={pdfState.sections}
                    includeCharts={pdfState.includeCharts}
                    includeNotes={pdfState.includeNotes}
                    blackAndWhite={pdfState.blackAndWhite}
                    onSectionToggle={handleSectionToggle}
                    onOptionToggle={handleOptionToggle}
                    estimatedPages={pdfState.estimatedPages}
                    estimatedSize={pdfState.estimatedSize}
                  />
                )}
                
                {pdfState.activeTab === 'branding' && (
                  <div className="space-y-4">
                    <p className="text-neutral-600">
                      Branding tab content coming in Phase 3...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE - Preview Panel (Desktop & Tablet) */}
            <div className="
              hidden lg:flex lg:flex-col
              lg:w-[55%] bg-neutral-50
              overflow-hidden
            ">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-neutral-400">
                    <div className="text-6xl mb-4">📄</div>
                    <p className="text-lg font-semibold mb-2">Live Preview</p>
                    <p className="text-sm">Coming in Phase 4...</p>
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE LAYOUT */}
            <div className="lg:hidden flex flex-col flex-1 overflow-hidden">
              {!pdfState.showMobilePreview ? (
                <>
                  {/* Tab Navigation */}
                  <div className="px-4 pt-4 flex-shrink-0">
                    <TabNavigation
                      activeTab={pdfState.activeTab}
                      onTabChange={handleTabChange}
                    />
                  </div>

                  {/* Tab Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    {pdfState.activeTab === 'sections' && (
                      <SectionsTab
                        sections={pdfState.sections}
                        includeCharts={pdfState.includeCharts}
                        includeNotes={pdfState.includeNotes}
                        blackAndWhite={pdfState.blackAndWhite}
                        onSectionToggle={handleSectionToggle}
                        onOptionToggle={handleOptionToggle}
                        estimatedPages={pdfState.estimatedPages}
                        estimatedSize={pdfState.estimatedSize}
                      />
                    )}
                    
                    {pdfState.activeTab === 'branding' && (
                      <div className="space-y-4">
                        <p className="text-neutral-600">
                          Branding tab content coming in Phase 3...
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Preview Button (Mobile Only) */}
                  <div className="px-4 py-3 border-t flex-shrink-0 bg-white">
                    <button
                      onClick={() => setPDFState(prev => ({ 
                        ...prev, 
                        showMobilePreview: true 
                      }))}
                      className="
                        w-full py-4
                        bg-gradient-to-r from-primary-500 to-primary-600
                        text-white font-semibold text-lg
                        rounded-xl shadow-lg
                        flex items-center justify-center gap-3
                        hover:from-primary-600 hover:to-primary-700
                        active:scale-[0.98]
                        transition-all duration-200
                      "
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Preview PDF</span>
                    </button>
                  </div>
                </>
              ) : (
                // Mobile Preview Overlay (Coming in Phase 5)
                <div className="flex-1 flex items-center justify-center bg-neutral-50">
                  <div className="text-center text-neutral-400">
                    <div className="text-6xl mb-4">📱</div>
                    <p className="text-lg font-semibold mb-2">Mobile Preview</p>
                    <p className="text-sm mb-4">Coming in Phase 5...</p>
                    <button
                      onClick={() => setPDFState(prev => ({ 
                        ...prev, 
                        showMobilePreview: false 
                      }))}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg"
                    >
                      Back to Customize
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer - Action Buttons */}
          <div className="
            flex items-center justify-end gap-3
            px-6 py-4 border-t
            flex-shrink-0 bg-white
          ">
            <button
              onClick={handleClose}
              disabled={pdfState.isGenerating}
              className="
                px-6 py-2.5 rounded-lg
                border border-neutral-300
                text-neutral-700 font-semibold
                hover:bg-neutral-50
                transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Cancel
            </button>
            
            <button
              onClick={() => {
                // PDF generation coming in Phase 7
                alert(`PDF will include ${pdfState.sections.filter(s => s.enabled).length} sections\nEstimated: ${pdfState.estimatedPages} pages, ~${pdfState.estimatedSize} MB`)
              }}
              disabled={pdfState.isGenerating}
              className="
                px-6 py-2.5 rounded-lg
                bg-primary-600 text-white font-semibold
                hover:bg-primary-700
                transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2
              "
            >
              {pdfState.isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}