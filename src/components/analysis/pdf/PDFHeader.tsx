// src/components/analysis/pdf/PDFHeader.tsx
'use client'

import { ContactInfo, BrandingColors } from '@/types/pdf'

interface PDFHeaderProps {
  propertyName: string
  contactInfo: ContactInfo
  colors: BrandingColors
  blackAndWhite: boolean
}

export function PDFHeader({ 
  propertyName, 
  contactInfo, 
  colors,
  blackAndWhite 
}: PDFHeaderProps) {
  const headerStyle = blackAndWhite 
    ? {
        backgroundColor: '#000000',
        color: '#FFFFFF',
        borderBottom: '3px solid #6B7280'  // ✅ ADDED ACCENT BORDER
      }
    : {
        backgroundColor: colors.headerFooterBg,
        color: colors.headerFooterText,
        borderBottom: `3px solid ${colors.accentColor}`  // ✅ ADDED ACCENT BORDER
      }

  // Show contact info in header if position is "header" or "both"
  const showContactInHeader = contactInfo.position === 'header' || contactInfo.position === 'both'

  return (
    <div 
      className="pdf-header"
      style={headerStyle}
    >
      <div className="px-6 py-4 flex justify-between items-start">
        {/* Left side - Property info - ALWAYS SHOW */}
        <div>
          <h1 className="text-xl font-bold mb-1">{propertyName}</h1>
          <p className="text-sm opacity-90">Property Analysis Report</p>
        </div>
        
        {/* Right side - Contact info - SHOW BASED ON POSITION */}
        {showContactInHeader && (
          <div className="text-right text-sm space-y-1">
            {contactInfo.showCompanyName && contactInfo.companyName && (
              <div className="font-semibold">{contactInfo.companyName}</div>
            )}
            {contactInfo.showName && contactInfo.name && (
              <div>{contactInfo.name}</div>
            )}
            {contactInfo.showLicenseNumber && contactInfo.licenseNumber && (
              <div className="text-xs opacity-90">{contactInfo.licenseNumber}</div>
            )}
            {contactInfo.showEmail && contactInfo.email && (
              <div className="text-xs">{contactInfo.email}</div>
            )}
            {contactInfo.showPhone && contactInfo.phone && (
              <div className="text-xs">{contactInfo.phone}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}