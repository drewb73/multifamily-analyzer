// src/components/analysis/pdf/PDFExportModal.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Download, Loader2, FileText } from 'lucide-react'
import { PDFExportState, PDFTabType, ContactInfo, BrandingColors } from '@/types/pdf'
import { TabNavigation } from './TabNavigation'
import { SectionsTab } from './SectionsTab'
import { BrandingTab } from './BrandingTab'
import { PreviewPanel } from './PreviewPanel'
import { createDefaultSections } from './defaultSections'
import { generatePDFFromElement, generatePDFFilename } from '@/lib/pdfGenerator'

interface PDFExportModalProps {
  isOpen: boolean
  onClose: () => void
  propertyName: string
  userName?: string
  userEmail?: string
  isCashPurchase?: boolean
  hasMarketAnalysis?: boolean
  inputs?: any 
  results?: any 
}

// Loading Overlay Component - Inline
function PDFGeneratingOverlay({ isGenerating }: { isGenerating: boolean }) {
  if (!isGenerating) return null

  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
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

export function PDFExportModal({
  isOpen,
  onClose,
  propertyName,
  userName = '',
  userEmail = '',
  isCashPurchase = false,
  hasMarketAnalysis = false,
  inputs,
  results
}: PDFExportModalProps) {
  // Refs for the actual PDF document content (not the preview wrapper)
  const desktopPdfRef = useRef<HTMLDivElement>(null)
  const mobilePdfRef = useRef<HTMLDivElement>(null)

  // Initialize state with defaults
  const [pdfState, setPDFState] = useState<PDFExportState>({
    sections: createDefaultSections(isCashPurchase, hasMarketAnalysis),
    includeCharts: true,
    includeNotes: true,
    blackAndWhite: false,
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
    activeTab: 'sections',
    previewZoom: 75,
    isGenerating: false,
    estimatedPages: 0,
    estimatedSize: '0',
    showMobilePreview: false
  })

  // Calculate estimated pages and file size
  useEffect(() => {
    const enabledSections = pdfState.sections.filter(s => s.enabled)
    const totalPages = enabledSections.reduce((sum, s) => sum + s.estimatedPages, 0)
    
    let adjustedPages = totalPages
    if (pdfState.includeCharts) adjustedPages += 0.5
    if (pdfState.includeNotes) adjustedPages += 1
    
    const estimatedPages = Math.ceil(adjustedPages)
    
    let sizeInMB = estimatedPages * 0.5
    if (pdfState.includeCharts) {
      const chartsCount = enabledSections.length * 0.5
      sizeInMB += chartsCount * 0.3
    }
    
    setPDFState(prev => ({
      ...prev,
      estimatedPages,
      estimatedSize: sizeInMB.toFixed(1)
    }))
  }, [pdfState.sections, pdfState.includeCharts, pdfState.includeNotes])

  const handleTabChange = (tab: PDFTabType) => {
    setPDFState(prev => ({ ...prev, activeTab: tab }))
  }

  const handleSectionToggle = (sectionId: string, enabled: boolean) => {
    setPDFState(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, enabled } : section
      )
    }))
  }

  const handleOptionToggle = (
    option: 'includeCharts' | 'includeNotes' | 'blackAndWhite',
    value: boolean
  ) => {
    setPDFState(prev => ({ ...prev, [option]: value }))
  }

  const handleContactChange = (field: keyof ContactInfo, value: string | boolean) => {
    setPDFState(prev => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, [field]: value }
    }))
  }

  const handleColorChange = (field: keyof BrandingColors, value: string) => {
    setPDFState(prev => ({
      ...prev,
      colors: { ...prev.colors, [field]: value }
    }))
  }

  const handlePresetApply = (bg: string, text: string, accent: string) => {
    setPDFState(prev => ({
      ...prev,
      colors: { headerFooterBg: bg, headerFooterText: text, accentColor: accent }
    }))
  }

  const handleGeneratePDF = async () => {
    // Determine which ref to use based on what's actually visible
    let pdfElement: HTMLElement | null = null
    
    // Try desktop ref first (check if it's visible in the DOM)
    if (desktopPdfRef.current && desktopPdfRef.current.offsetParent !== null) {
      pdfElement = desktopPdfRef.current
    } 
    // Fall back to mobile ref if desktop isn't visible
    else if (mobilePdfRef.current && mobilePdfRef.current.offsetParent !== null) {
      pdfElement = mobilePdfRef.current
    }

    // Validate we found a visible element
    if (!pdfElement) {
      console.error('PDF element not found or not visible')
      alert('Error: PDF preview not found. Please make sure the preview is visible and try again.')
      return
    }

    // Validate element has dimensions
    if (pdfElement.offsetHeight === 0 || pdfElement.offsetWidth === 0) {
      console.error('PDF element has no dimensions:', {
        height: pdfElement.offsetHeight,
        width: pdfElement.offsetWidth
      })
      alert('Error: PDF content has no dimensions. Please try again.')
      return
    }

    // Check if any sections are enabled
    const enabledSections = pdfState.sections.filter(s => s.enabled)
    if (enabledSections.length === 0) {
      alert('Please select at least one section to include in the PDF.')
      return
    }

    // Set generating state
    setPDFState(prev => ({ ...prev, isGenerating: true }))

    try {
      // Generate filename
      const filename = generatePDFFilename(propertyName)

      // Generate PDF with progress
      const result = await generatePDFFromElement(pdfElement, {
        filename,
        quality: pdfState.blackAndWhite ? 0.85 : 0.92,
        scale: 2,
        onProgress: (progress) => {
          console.log(`PDF Generation: ${progress}%`)
        }
      })

      if (result.success) {
        console.log('PDF generated successfully:', result.filename)
        // Optional: Show success message
        // alert('PDF downloaded successfully!')
      } else {
        console.error('PDF generation failed:', result.error)
        alert(`Failed to generate PDF: ${result.error}`)
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('An unexpected error occurred while generating the PDF')
    } finally {
      setPDFState(prev => ({ ...prev, isGenerating: false }))
    }
  }

  const handleClose = () => {
    if (pdfState.isGenerating) return
    onClose()
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !pdfState.isGenerating) {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, pdfState.isGenerating])

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
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Loading Overlay - Hides the width flash during PDF generation */}
          <PDFGeneratingOverlay isGenerating={pdfState.isGenerating} />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
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
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-neutral-500" />
            </button>
          </div>

          {/* Content Area - Split Layout */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            
            {/* LEFT SIDE - Customization Panel (Desktop & Tablet) */}
            <div className="hidden lg:flex lg:flex-col lg:w-[45%] border-r overflow-hidden">
              <div className="px-6 pt-4 flex-shrink-0">
                <TabNavigation
                  activeTab={pdfState.activeTab}
                  onTabChange={handleTabChange}
                />
              </div>

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
                  <BrandingTab
                    contactInfo={pdfState.contactInfo}
                    colors={pdfState.colors}
                    onContactChange={handleContactChange}
                    onColorChange={handleColorChange}
                    onPresetApply={handlePresetApply}
                  />
                )}
              </div>
            </div>

            {/* RIGHT SIDE - Preview Panel (Desktop & Tablet) */}
            <div className="hidden lg:flex lg:flex-col lg:w-[55%] overflow-hidden">
              <PreviewPanel
                propertyName={propertyName}
                sections={pdfState.sections}
                contactInfo={pdfState.contactInfo}
                colors={pdfState.colors}
                includeCharts={pdfState.includeCharts}
                includeNotes={pdfState.includeNotes}
                blackAndWhite={pdfState.blackAndWhite}
                estimatedPages={pdfState.estimatedPages}
                inputs={inputs}
                results={results}
                pdfRef={desktopPdfRef}
              />
            </div>

            {/* MOBILE LAYOUT */}
            <div className="lg:hidden flex flex-col flex-1 overflow-hidden">
              {!pdfState.showMobilePreview ? (
                <>
                  <div className="px-4 pt-4 flex-shrink-0">
                    <TabNavigation
                      activeTab={pdfState.activeTab}
                      onTabChange={handleTabChange}
                    />
                  </div>

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
                      <BrandingTab
                        contactInfo={pdfState.contactInfo}
                        colors={pdfState.colors}
                        onContactChange={handleContactChange}
                        onColorChange={handleColorChange}
                        onPresetApply={handlePresetApply}
                      />
                    )}
                  </div>

                  <div className="px-4 py-3 border-t flex-shrink-0 bg-white">
                    <button
                      onClick={() => setPDFState(prev => ({ 
                        ...prev, 
                        showMobilePreview: true 
                      }))}
                      className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-lg rounded-xl shadow-lg flex items-center justify-center gap-3 hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] transition-all duration-200"
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
                <div className="flex-1 flex flex-col overflow-hidden bg-neutral-50">
                  <div className="flex items-center justify-between p-4 border-b bg-white">
                    <button
                      onClick={() => setPDFState(prev => ({ 
                        ...prev, 
                        showMobilePreview: false 
                      }))}
                      className="flex items-center gap-2 text-primary-600 font-semibold"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Customize
                    </button>
                    <div className="text-sm text-neutral-600">
                      Page 1 of {pdfState.estimatedPages}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    <PreviewPanel
                      propertyName={propertyName}
                      sections={pdfState.sections}
                      contactInfo={pdfState.contactInfo}
                      colors={pdfState.colors}
                      includeCharts={pdfState.includeCharts}
                      includeNotes={pdfState.includeNotes}
                      blackAndWhite={pdfState.blackAndWhite}
                      estimatedPages={pdfState.estimatedPages}
                      inputs={inputs}
                      results={results}
                      pdfRef={mobilePdfRef}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer - Action Buttons */}
          <div className="flex items-center justify-between px-6 py-4 bg-neutral-50 border-t flex-shrink-0">
            <div className="text-sm text-neutral-600">
              Estimated: {pdfState.estimatedPages} pages • ~{pdfState.estimatedSize}MB
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={pdfState.isGenerating}
                className="px-4 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close
              </button>
              <button
                onClick={handleGeneratePDF}
                disabled={pdfState.isGenerating || pdfState.sections.filter(s => s.enabled).length === 0}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {pdfState.isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Generate PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}