// src/components/analysis/pdf/BrandingTab.tsx
'use client'

import { ContactInfo, BrandingColors } from '@/types/pdf'
import { COLOR_PRESETS } from './colorPresets'

interface BrandingTabProps {
  contactInfo: ContactInfo
  colors: BrandingColors
  onContactChange: (field: keyof ContactInfo, value: string | boolean) => void
  onColorChange: (field: keyof BrandingColors, value: string) => void
  onPresetApply: (bg: string, text: string, accent: string) => void
}

export function BrandingTab({
  contactInfo,
  colors,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Personalize Your PDF
        </h3>
        <p className="text-sm text-neutral-600">
          Add your contact information and customize the header/footer colors
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
            <label htmlFor="showName" className="font-medium text-neutral-900 cursor-pointer">
              Your Name
            </label>
          </div>
          {contactInfo.showName && (
            <input
              type="text"
              value={contactInfo.name}
              onChange={(e) => onContactChange('name', e.target.value)}
              placeholder="John Smith"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg 
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
            <label htmlFor="showEmail" className="font-medium text-neutral-900 cursor-pointer">
              Email Address
            </label>
          </div>
          {contactInfo.showEmail && (
            <input
              type="email"
              value={contactInfo.email}
              onChange={(e) => onContactChange('email', e.target.value)}
              placeholder="john@example.com"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg 
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
            <label htmlFor="showPhone" className="font-medium text-neutral-900 cursor-pointer">
              Phone Number
            </label>
          </div>
          {contactInfo.showPhone && (
            <input
              type="tel"
              value={contactInfo.phone}
              onChange={(e) => onContactChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg 
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
        <h4 className="font-semibold text-neutral-700">Show Contact Info In</h4>
        
        <label className="flex items-center gap-3 cursor-pointer group">
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
            <div className="font-medium text-neutral-900 group-hover:text-neutral-700">
              Header only
            </div>
            <div className="text-xs text-neutral-500">
              Contact info appears at the top of each page
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
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
            <div className="font-medium text-neutral-900 group-hover:text-neutral-700">
              Footer only
              <span className="ml-2 text-xs text-primary-600 font-semibold">(Recommended)</span>
            </div>
            <div className="text-xs text-neutral-500">
              Contact info appears at the bottom of each page
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
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
            <div className="font-medium text-neutral-900 group-hover:text-neutral-700">
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

      {/* Color Customization */}
      <div className="space-y-4">
        <h4 className="font-semibold text-neutral-700">Header/Footer Colors</h4>
        
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

        {/* Contrast Warning */}
        {isValidHex(colors.headerFooterBg) && isValidHex(colors.headerFooterText) && !hasGoodContrast() && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex gap-2 text-sm text-yellow-800">
              <span>⚠️</span>
              <span>Low contrast detected. Text may be hard to read on this background.</span>
            </div>
          </div>
        )}

        {/* Preset Colors */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Quick Color Presets
          </label>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onPresetApply(preset.bg, preset.text, preset.accent)}
                className="
                  relative h-12 rounded-lg border-2 
                  transition-all duration-200
                  hover:scale-105 hover:shadow-md
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  group
                "
                style={{ 
                  backgroundColor: preset.bg,
                  borderColor: colors.headerFooterBg === preset.bg ? '#3B82F6' : 'transparent'
                }}
                title={preset.name}
              >
                {/* Text color indicator */}
                <div 
                  className="absolute inset-0 m-auto w-4 h-4 rounded-full border-2 border-white/50"
                  style={{ backgroundColor: preset.text }}
                />
                
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
            ))}
          </div>
        </div>
      </div>

      {/* Preview Note */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex gap-2 text-sm text-blue-800">
          <span>💡</span>
          <span>Changes will appear in the live preview on the right (coming in Phase 4)</span>
        </div>
      </div>
    </div>
  )
}