// src/components/analysis/pdf/BrandingTab.tsx
'use client'

import { ContactInfo, BrandingColors } from '@/types/pdf'

interface BrandingTabProps {
  contactInfo: ContactInfo
  colors: BrandingColors
  blackAndWhite: boolean  // NEW - to disable color pickers
  onContactChange: (field: keyof ContactInfo, value: string | boolean) => void
  onColorChange: (field: keyof BrandingColors, value: string) => void
}

export function BrandingTab({
  contactInfo,
  colors,
  blackAndWhite,
  onContactChange,
  onColorChange,
}: BrandingTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Personalize Your PDF
        </h3>
        <p className="text-sm text-neutral-600">
          Add your contact information and company details
        </p>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4">
        <h4 className="font-semibold text-neutral-700">Contact Information</h4>
        
        {/* Name Field */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="showName"
              checked={contactInfo.showName}
              onChange={(e) => onContactChange('showName', e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-primary-600 
                         focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
            />
            <label htmlFor="showName" className="font-medium text-neutral-900 cursor-pointer text-sm">
              Your Name
            </label>
          </div>
          {contactInfo.showName && (
            <input
              type="text"
              value={contactInfo.name}
              onChange={(e) => onContactChange('name', e.target.value)}
              placeholder="John Smith"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         text-neutral-900 placeholder:text-neutral-400"
            />
          )}
        </div>

        {/* Company Name Field - NEW */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="showCompanyName"
              checked={contactInfo.showCompanyName}
              onChange={(e) => onContactChange('showCompanyName', e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-primary-600 
                         focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
            />
            <label htmlFor="showCompanyName" className="font-medium text-neutral-900 cursor-pointer text-sm">
              Company Name
            </label>
          </div>
          {contactInfo.showCompanyName && (
            <input
              type="text"
              value={contactInfo.companyName}
              onChange={(e) => onContactChange('companyName', e.target.value)}
              placeholder="ABC Realty Group"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         text-neutral-900 placeholder:text-neutral-400"
            />
          )}
        </div>

        {/* License Number Field - NEW */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="showLicenseNumber"
              checked={contactInfo.showLicenseNumber}
              onChange={(e) => onContactChange('showLicenseNumber', e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-primary-600 
                         focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
            />
            <label htmlFor="showLicenseNumber" className="font-medium text-neutral-900 cursor-pointer text-sm">
              License Number
            </label>
          </div>
          {contactInfo.showLicenseNumber && (
            <input
              type="text"
              value={contactInfo.licenseNumber}
              onChange={(e) => onContactChange('licenseNumber', e.target.value)}
              placeholder="DRE #01234567"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         text-neutral-900 placeholder:text-neutral-400"
            />
          )}
        </div>

        {/* Email Field */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="showEmail"
              checked={contactInfo.showEmail}
              onChange={(e) => onContactChange('showEmail', e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-primary-600 
                         focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
            />
            <label htmlFor="showEmail" className="font-medium text-neutral-900 cursor-pointer text-sm">
              Email Address
            </label>
          </div>
          {contactInfo.showEmail && (
            <input
              type="email"
              value={contactInfo.email}
              onChange={(e) => onContactChange('email', e.target.value)}
              placeholder="john@example.com"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         text-neutral-900 placeholder:text-neutral-400"
            />
          )}
        </div>

        {/* Phone Field */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="showPhone"
              checked={contactInfo.showPhone}
              onChange={(e) => onContactChange('showPhone', e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-primary-600 
                         focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
            />
            <label htmlFor="showPhone" className="font-medium text-neutral-900 cursor-pointer text-sm">
              Phone Number
            </label>
          </div>
          {contactInfo.showPhone && (
            <input
              type="tel"
              value={contactInfo.phone}
              onChange={(e) => onContactChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                         text-neutral-900 placeholder:text-neutral-400"
            />
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-200" />

      {/* Position Selection */}
      <div className="space-y-3">
        <h4 className="font-semibold text-neutral-700 text-sm">Show Contact Info In</h4>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="position"
            value="header"
            checked={contactInfo.position === 'header'}
            onChange={() => onContactChange('position', 'header')}
            className="w-4 h-4 border-neutral-300 text-primary-600 
                       focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
          />
          <div>
            <div className="font-medium text-neutral-900 text-sm">
              Header only
            </div>
            <div className="text-xs text-neutral-500">
              Contact info appears at the top of each page
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="position"
            value="footer"
            checked={contactInfo.position === 'footer'}
            onChange={() => onContactChange('position', 'footer')}
            className="w-4 h-4 border-neutral-300 text-primary-600 
                       focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
          />
          <div>
            <div className="font-medium text-neutral-900 text-sm">
              Footer only
              <span className="ml-2 text-xs text-primary-600 font-semibold">(Recommended)</span>
            </div>
            <div className="text-xs text-neutral-500">
              Contact info appears at the bottom of each page
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="position"
            value="both"
            checked={contactInfo.position === 'both'}
            onChange={() => onContactChange('position', 'both')}
            className="w-4 h-4 border-neutral-300 text-primary-600 
                       focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
          />
          <div>
            <div className="font-medium text-neutral-900 text-sm">
              Both header and footer
            </div>
            <div className="text-xs text-neutral-500">
              Contact info appears on both top and bottom
            </div>
          </div>
        </label>
      </div>

      {/* Divider */}
      <div className="border-t border-neutral-200" />

      {/* Color Customization - DISABLED when Black & White is on */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-neutral-700 text-sm">Header/Footer Colors</h4>
          {blackAndWhite && (
            <span className="text-xs text-neutral-500 italic">
              Disabled in Black & White mode
            </span>
          )}
        </div>
        
        {blackAndWhite ? (
          <div className="p-4 bg-neutral-100 rounded-lg border border-neutral-200">
            <p className="text-sm text-neutral-600 text-center">
              Color customization is disabled when "Black & White" mode is enabled. 
              Go to the Sections tab to disable Black & White mode to customize colors.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <p className="text-sm text-neutral-600">
              <strong>Note:</strong> Color customization has been simplified. The PDF will use the default NumexRE branding colors.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}