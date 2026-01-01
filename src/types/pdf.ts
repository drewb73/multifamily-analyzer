// src/types/pdf.ts

export interface PDFSectionConfig {
  id: string
  label: string
  description: string
  icon: string
  required: boolean
  enabled: boolean
  estimatedPages: number
  condition?: boolean  // Optional condition to show/hide section
  comingSoon?: boolean
}

export interface ContactInfo {
  name: string
  email: string
  phone: string
  companyName: string  // NEW
  licenseNumber: string  // NEW
  showName: boolean
  showEmail: boolean
  showPhone: boolean
  showCompanyName: boolean  // NEW
  showLicenseNumber: boolean  // NEW
  position: 'header' | 'footer' | 'both'
}

export interface BrandingColors {
  headerFooterBg: string
  headerFooterText: string
  accentColor: string
}

export interface PDFExportOptions {
  sections: PDFSectionConfig[]
  includeCharts: boolean
  includeNotes: boolean
  blackAndWhite: boolean
  contactInfo: ContactInfo
  colors: BrandingColors
}

export interface PDFExportState extends PDFExportOptions {
  previewZoom: number
  isGenerating: boolean
  estimatedPages: number
  estimatedSize: string
  showMobilePreview: boolean
  activeTab: 'sections' | 'branding'
}

export type PDFTabType = 'sections' | 'branding'