// src/components/analysis/pdf/PDFHeader.tsx
'use client'

import { ContactInfo, BrandingColors } from '@/types/pdf'

interface PDFHeaderProps {
  propertyName: string
  contactInfo: ContactInfo
  colors: BrandingColors
  showContact: boolean
}

export function PDFHeader({ 
  propertyName, 
  contactInfo, 
  colors,
  showContact 
}: PDFHeaderProps) {
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

  return (
    <div 
      className="pdf-header"
      style={{
        backgroundColor: colors.headerFooterBg,
        color: colors.headerFooterText,
        padding: '20px 0',
        borderBottom: `3px solid ${colors.accentColor}`
      }}
    >
      <div className="flex justify-between items-start px-[30px]">
        {/* Left: Property Name */}
        <div className="flex-1">
          <h1 className="text-xl font-bold mb-1">
            {propertyName}
          </h1>
          <p className="text-sm opacity-90">
            Property Analysis Report
          </p>
        </div>

        {/* Right: Contact Info (if enabled) */}
        {showContact && contactFields.length > 0 && (
          <div className="text-right text-sm">
            {contactInfo.showName && contactInfo.name && (
              <div className="font-semibold mb-0.5">
                {contactInfo.name}
              </div>
            )}
            {contactInfo.showEmail && contactInfo.email && (
              <div className="opacity-90 mb-0.5">
                {contactInfo.email}
              </div>
            )}
            {contactInfo.showPhone && contactInfo.phone && (
              <div className="opacity-90">
                {contactInfo.phone}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}