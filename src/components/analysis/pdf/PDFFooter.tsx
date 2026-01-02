// src/components/analysis/pdf/PDFFooter.tsx
'use client'

import { ContactInfo, BrandingColors } from '@/types/pdf'

interface PDFFooterProps {
  contactInfo: ContactInfo
  colors: BrandingColors
  blackAndWhite: boolean
  pageNumber?: number
}

export function PDFFooter({ 
  contactInfo, 
  colors,
  blackAndWhite,
  pageNumber 
}: PDFFooterProps) {
  const footerStyle = blackAndWhite 
    ? {
        backgroundColor: '#000000',
        color: '#FFFFFF',
        borderTop: '3px solid #6B7280'  // ✅ ADDED ACCENT BORDER
      }
    : {
        backgroundColor: colors.headerFooterBg,
        color: colors.headerFooterText,
        borderTop: `3px solid ${colors.accentColor}`  // ✅ ADDED ACCENT BORDER
      }

  // Show contact info in footer if position is "footer" or "both"
  const showContactInFooter = contactInfo.position === 'footer' || contactInfo.position === 'both'

  // Build contact info parts array
  const contactParts: string[] = []
  
  if (contactInfo.showCompanyName && contactInfo.companyName) {
    contactParts.push(contactInfo.companyName)
  }
  
  if (contactInfo.showName && contactInfo.name) {
    contactParts.push(contactInfo.name)
  }
  
  if (contactInfo.showLicenseNumber && contactInfo.licenseNumber) {
    contactParts.push(contactInfo.licenseNumber)
  }
  
  if (contactInfo.showEmail && contactInfo.email) {
    contactParts.push(contactInfo.email)
  }
  
  if (contactInfo.showPhone && contactInfo.phone) {
    contactParts.push(contactInfo.phone)
  }

  return (
    <div 
      className="pdf-footer"
      style={footerStyle}
    >
      <div className="px-6 py-3">
        {/* Contact info BASED ON POSITION */}
        {showContactInFooter && contactParts.length > 0 ? (
          <div className="text-sm">
            {contactParts.join(' • ')}
          </div>
        ) : (
          <div className="text-sm opacity-75">
            Property Analysis Report
          </div>
        )}
      </div>
    </div>
  )
}