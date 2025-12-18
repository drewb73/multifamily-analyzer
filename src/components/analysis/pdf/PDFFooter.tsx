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
        borderTop: `3px solid ${colors.accentColor}`,
        width: '100%',
        margin: 0,
        padding: 0
      }}
    >
      {/* Inner wrapper with padding for content */}
      <div style={{ padding: '15px 30px' }}>
        <div className="flex justify-between items-center text-sm">
          {/* Left: Contact Info (if enabled) */}
          {showContact && contactFields.length > 0 ? (
            <div className="flex items-center gap-2">
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
          ) : (
            <div />
          )}

          {/* Right: Generated Date */}
          <div className="opacity-90 text-right whitespace-nowrap ml-auto">
            {currentDate}
          </div>
        </div>
      </div>
    </div>
  )
}