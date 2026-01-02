// src/components/analysis/pdf/BrandingTab.tsx
'use client'

import { ContactInfo, BrandingColors } from '@/types/pdf'
import { COLOR_PRESETS } from './colorPresets'

interface BrandingTabProps {
  contactInfo: ContactInfo
  colors: BrandingColors
  blackAndWhite: boolean
  onContactChange: (field: keyof ContactInfo, value: string | boolean) => void
  onColorChange: (field: keyof BrandingColors, value: string) => void
  onPresetApply: (bg: string, text: string, accent: string) => void
}

export function BrandingTab({
  contactInfo,
  colors,
  blackAndWhite,
  onContactChange,
  onColorChange,
  onPresetApply
}: BrandingTabProps) {
  // Validate hex color
  const isValidHex = (color: string): boolean => {
    return /^#[0-9A-F]{6}$/i.test(color)
  }

  // Check color contrast (simple version)
  const hasGoodContrast = (): boolean => {
    // Simple check: if background is dark and text is light, or vice versa
    const bgLuminance = parseInt(colors.headerFooterBg.slice(1), 16)
    const textLuminance = parseInt(colors.headerFooterText.slice(1), 16)
    const diff = Math.abs(bgLuminance - textLuminance)
    return diff > 0x444444 // Rough threshold
  }

  // Handle checkbox changes for position
  const handlePositionChange = (position: 'header' | 'footer', checked: boolean) => {
    const isHeaderChecked = contactInfo.position === 'header' || contactInfo.position === 'both'
    const isFooterChecked = contactInfo.position === 'footer' || contactInfo.position === 'both'
    
    if (position === 'header') {
      if (checked && isFooterChecked) {
        onContactChange('position', 'both')
      } else if (checked && !isFooterChecked) {
        onContactChange('position', 'header')
      } else if (!checked && isFooterChecked) {
        onContactChange('position', 'footer')
      } else {
        // Don't allow unchecking if it's the only one checked
        // Keep it as header
        onContactChange('position', 'header')
      }
    } else if (position === 'footer') {
      if (checked && isHeaderChecked) {
        onContactChange('position', 'both')
      } else if (checked && !isHeaderChecked) {
        onContactChange('position', 'footer')
      } else if (!checked && isHeaderChecked) {
        onContactChange('position', 'header')
      } else {
        // Don't allow unchecking if it's the only one checked
        // Keep it as footer
        onContactChange('position', 'footer')
      }
    }
  }

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

        {/* Company Name Field */}
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

        {/* License Number Field */}
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

      {/* Position Selection - TWO CHECKBOXES */}
      <div className="space-y-3">
        <h4 className="font-semibold text-neutral-700 text-sm">Show Contact Info In</h4>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showInHeader"
            checked={contactInfo.position === 'header' || contactInfo.position === 'both'}
            onChange={(e) => handlePositionChange('header', e.target.checked)}
            className="w-4 h-4 rounded border-neutral-300 text-primary-600 
                       focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
          />
          <label htmlFor="showInHeader" className="font-medium text-neutral-900 cursor-pointer text-sm">
            Header
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showInFooter"
            checked={contactInfo.position === 'footer' || contactInfo.position === 'both'}
            onChange={(e) => handlePositionChange('footer', e.target.checked)}
            className="w-4 h-4 rounded border-neutral-300 text-primary-600 
                       focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
          />
          <label htmlFor="showInFooter" className="font-medium text-neutral-900 cursor-pointer text-sm">
            Footer
          </label>
        </div>
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
          <>
            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Background Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.headerFooterBg}
                  onChange={(e) => onColorChange('headerFooterBg', e.target.value)}
                  className="w-12 h-12 rounded border border-neutral-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.headerFooterBg}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.startsWith('#') && value.length <= 7) {
                      onColorChange('headerFooterBg', value.toUpperCase())
                    }
                  }}
                  placeholder="#1E40AF"
                  maxLength={7}
                  className={`
                    flex-1 px-3 py-2 border rounded-lg font-mono text-sm
                    focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                    ${isValidHex(colors.headerFooterBg) 
                      ? 'border-neutral-300 text-neutral-900' 
                      : 'border-red-300 text-red-700 bg-red-50'
                    }
                  `}
                />
              </div>
              {!isValidHex(colors.headerFooterBg) && (
                <p className="text-xs text-red-600 mt-1">
                  Please enter a valid hex color (e.g., #1E40AF)
                </p>
              )}
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Text Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.headerFooterText}
                  onChange={(e) => onColorChange('headerFooterText', e.target.value)}
                  className="w-12 h-12 rounded border border-neutral-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.headerFooterText}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.startsWith('#') && value.length <= 7) {
                      onColorChange('headerFooterText', value.toUpperCase())
                    }
                  }}
                  placeholder="#FFFFFF"
                  maxLength={7}
                  className={`
                    flex-1 px-3 py-2 border rounded-lg font-mono text-sm
                    focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                    ${isValidHex(colors.headerFooterText) 
                      ? 'border-neutral-300 text-neutral-900' 
                      : 'border-red-300 text-red-700 bg-red-50'
                    }
                  `}
                />
              </div>
              {!isValidHex(colors.headerFooterText) && (
                <p className="text-xs text-red-600 mt-1">
                  Please enter a valid hex color (e.g., #FFFFFF)
                </p>
              )}
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.accentColor}
                  onChange={(e) => onColorChange('accentColor', e.target.value)}
                  className="w-12 h-12 rounded border border-neutral-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.accentColor}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.startsWith('#') && value.length <= 7) {
                      onColorChange('accentColor', value.toUpperCase())
                    }
                  }}
                  placeholder="#3B82F6"
                  maxLength={7}
                  className={`
                    flex-1 px-3 py-2 border rounded-lg font-mono text-sm
                    focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                    ${isValidHex(colors.accentColor) 
                      ? 'border-neutral-300 text-neutral-900' 
                      : 'border-red-300 text-red-700 bg-red-50'
                    }
                  `}
                />
              </div>
              {!isValidHex(colors.accentColor) && (
                <p className="text-xs text-red-600 mt-1">
                  Please enter a valid hex color (e.g., #3B82F6)
                </p>
              )}
            </div>

            {/* Contrast Warning */}
            {isValidHex(colors.headerFooterBg) && isValidHex(colors.headerFooterText) && !hasGoodContrast() && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex gap-2 text-sm text-yellow-800">
                  <span>⚠️</span>
                  <span>Low contrast detected. Text may be hard to read on this background.</span>
                </div>
              </div>
            )}

            {/* Preset Colors - NO INNER CIRCLE */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Quick Color Presets
              </label>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_PRESETS.map((preset) => {
                  // Check if this preset is currently selected
                  const isSelected = colors.headerFooterBg === preset.bg && 
                                     colors.headerFooterText === preset.text && 
                                     colors.accentColor === preset.accent
                  
                  return (
                    <button
                      key={preset.name}
                      onClick={() => onPresetApply(preset.bg, preset.text, preset.accent)}
                      className={`
                        relative h-12 rounded-lg border-2 
                        transition-all duration-200
                        hover:scale-105 hover:shadow-md
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                        group
                        ${isSelected ? 'ring-2 ring-primary-500 border-primary-500 scale-105' : 'border-transparent'}
                      `}
                      style={{ 
                        backgroundColor: preset.bg,
                      }}
                      title={preset.name}
                    >
                      {/* Checkmark indicator - ONLY show when selected */}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center shadow-md">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Tooltip */}
                      <div className="
                        absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                        px-2 py-1 bg-neutral-900 text-white text-xs rounded
                        opacity-0 group-hover:opacity-100 transition-opacity
                        whitespace-nowrap pointer-events-none z-10
                      ">
                        {preset.name}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}