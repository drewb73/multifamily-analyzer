// src/components/analysis/pdf/PDFFooter.tsx
'use client'

import { ContactInfo, BrandingColors } from '@/types/pdf'

interface PDFFooterProps {
  contactInfo: ContactInfo
  colors: BrandingColors
  showContact: boolean
  pageNumber?: number
  totalPages?: number
}

export function PDFFooter({ 
  contactInfo, 
  colors,
  showContact,
  pageNumber = 1,
  totalPages = 1
}: PDFFooterProps) {
  // Get contact fields that are enabled
  const contactFields = []
  if (contactInfo.showName && contactInfo.name) {
    contactFields.push(contactInfo.name)
  }
  if (contactInfo.showEmail && contactInfo.email) {
    contactFields.push(contactInfo.email)
  }
  if (contactInfo.showPhone && contactInfo.phone) {
    contactFields.push(contactInfo.phone)
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div 
      className="pdf-footer"
      style={{
        backgroundColor: colors.headerFooterBg,
        color: colors.headerFooterText,
        padding: '15px 30px',
        borderTop: `3px solid ${colors.accentColor}`
      }}
    >
      <div className="flex justify-between items-center text-sm">
        {/* Left: Page Number */}
        <div className="font-medium">
          Page {pageNumber} of {totalPages}
        </div>

        {/* Center: Contact Info (if enabled) */}
        {showContact && contactFields.length > 0 ? (
          <div className="text-center flex-1 mx-4">
            <div className="flex items-center justify-center gap-2">
              {contactInfo.showName && contactInfo.name && (
                <span className="font-semibold">
                  {contactInfo.name}
                </span>
              )}
              {(contactInfo.showEmail || contactInfo.showPhone) && (
                <span className="opacity-75">
                  {[
                    contactInfo.showEmail && contactInfo.email,
                    contactInfo.showPhone && contactInfo.phone
                  ].filter(Boolean).join(' • ')}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Right: Generated Date */}
        <div className="opacity-90 text-right whitespace-nowrap">
          {currentDate}
        </div>
      </div>
    </div>
  )
}