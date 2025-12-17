// src/components/analysis/pdf/PDFExportModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { PDFExportState, PDFTabType, ContactInfo, BrandingColors } from '@/types/pdf'
import { TabNavigation } from './TabNavigation'
import { SectionsTab } from './SectionsTab'
import { BrandingTab } from './BrandingTab'
import { PreviewPanel } from './PreviewPanel'
import { createDefaultSections } from './defaultSections'

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
          className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
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
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer - Action Buttons */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t flex-shrink-0 bg-white">
            <button
              onClick={handleClose}
              disabled={pdfState.isGenerating}
              className="px-6 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            
            <button
              onClick={() => {
                const contactFields = [
                  pdfState.contactInfo.showName && pdfState.contactInfo.name,
                  pdfState.contactInfo.showEmail && pdfState.contactInfo.email,
                  pdfState.contactInfo.showPhone && pdfState.contactInfo.phone
                ].filter(Boolean)
                
                alert(`PDF will include:\n\n` +
                  `Sections: ${pdfState.sections.filter(s => s.enabled).length}\n` +
                  `Pages: ${pdfState.estimatedPages}\n` +
                  `Size: ~${pdfState.estimatedSize} MB\n\n` +
                  `Contact: ${contactFields.length > 0 ? contactFields.join(', ') : 'None'}\n` +
                  `Position: ${pdfState.contactInfo.position}\n` +
                  `Colors: ${pdfState.colors.headerFooterBg} / ${pdfState.colors.headerFooterText}`)
              }}
              disabled={pdfState.isGenerating}
              className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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