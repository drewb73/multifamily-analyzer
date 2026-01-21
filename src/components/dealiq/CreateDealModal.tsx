// FILE LOCATION: /src/components/dealiq/CreateDealModal.tsx
// PURPOSE: Modal for creating new deals from scratch (without analysis)

'use client'

import { useState, useEffect } from 'react'
import { X, Building2, DollarSign, Home, Loader2 } from 'lucide-react'
import { US_STATES_AND_TERRITORIES } from '@/lib/constants/states'

interface CreateDealModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (dealId: string) => void
}

export function CreateDealModal({ isOpen, onClose, onSuccess }: CreateDealModalProps) {
  // Form state
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('CA') // Default to California
  const [zipCode, setZipCode] = useState('')
  const [price, setPrice] = useState('')
  const [squareFeet, setSquareFeet] = useState('')
  const [units, setUnits] = useState('')
  const [financingType, setFinancingType] = useState<'financed' | 'cash'>('financed')
  const [downPayment, setDownPayment] = useState('')
  const [loanTerm, setLoanTerm] = useState('30')
  const [loanRate, setLoanRate] = useState('')
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAddress('')
      setCity('')
      setState('CA')
      setZipCode('')
      setPrice('')
      setSquareFeet('')
      setUnits('')
      setFinancingType('financed')
      setDownPayment('')
      setLoanTerm('30')
      setLoanRate('')
      setError(null)
      setFieldErrors({})
    }
  }, [isOpen])

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Required fields
    if (!address.trim()) errors.address = 'Address is required'
    if (!city.trim()) errors.city = 'City is required'
    if (!state) errors.state = 'State is required'
    if (!zipCode.trim()) errors.zipCode = 'Zip code is required'
    else if (!/^\d{5}$/.test(zipCode)) errors.zipCode = 'Must be 5 digits'

    if (!price.trim()) errors.price = 'Purchase price is required'
    else if (parseFloat(price) <= 0) errors.price = 'Must be greater than 0'

    if (!squareFeet.trim()) errors.squareFeet = 'Square footage is required'
    else if (parseFloat(squareFeet) <= 0) errors.squareFeet = 'Must be greater than 0'

    if (!units.trim()) errors.units = 'Number of units is required'
    else if (parseInt(units) <= 0) errors.units = 'Must be at least 1'

    // Financing validation
    if (financingType === 'financed') {
      if (!downPayment.trim()) {
        errors.downPayment = 'Down payment is required'
      } else {
        const down = parseFloat(downPayment)
        const purchasePrice = parseFloat(price)
        if (down <= 0) errors.downPayment = 'Must be greater than 0'
        else if (down >= purchasePrice) errors.downPayment = 'Must be less than purchase price'
      }

      if (!loanRate.trim()) {
        errors.loanRate = 'Interest rate is required'
      } else {
        const rate = parseFloat(loanRate)
        if (rate <= 0 || rate > 30) errors.loanRate = 'Must be between 0 and 30'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Calculate down payment percentage
  const downPaymentPercent = () => {
    if (!price || !downPayment) return ''
    const percent = (parseFloat(downPayment) / parseFloat(price)) * 100
    return isNaN(percent) ? '' : ` (${percent.toFixed(1)}%)`
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setError('Please fix the errors below')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/dealiq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          city: city.trim(),
          state,
          zipCode: zipCode.trim(),
          price: parseFloat(price),
          squareFeet: parseFloat(squareFeet),
          units: parseInt(units),
          financingType,
          downPayment: financingType === 'financed' ? parseFloat(downPayment) : null,
          loanTerm: financingType === 'financed' ? parseInt(loanTerm) : null,
          loanRate: financingType === 'financed' ? parseFloat(loanRate) : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create deal')
      }

      // Success!
      onSuccess(data.deal.id)
      onClose()
    } catch (err: any) {
      console.error('Create deal error:', err)
      setError(err.message || 'Failed to create deal')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">Create New Deal</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Global Error */}
          {error && (
            <div className="bg-error-50 text-error-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Property Information Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
                Property Information
              </h3>
            </div>
            <div className="space-y-4">
              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Address <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    fieldErrors.address ? 'border-error-500' : 'border-neutral-300'
                  }`}
                  placeholder="123 Main Street"
                  disabled={isSubmitting}
                />
                {fieldErrors.address && (
                  <p className="text-error-600 text-sm mt-1">{fieldErrors.address}</p>
                )}
              </div>

              {/* City, State, Zip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    City <span className="text-error-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.city ? 'border-error-500' : 'border-neutral-300'
                    }`}
                    placeholder="Sacramento"
                    disabled={isSubmitting}
                  />
                  {fieldErrors.city && (
                    <p className="text-error-600 text-sm mt-1">{fieldErrors.city}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    State <span className="text-error-600">*</span>
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.state ? 'border-error-500' : 'border-neutral-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    {US_STATES_AND_TERRITORIES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.state && (
                    <p className="text-error-600 text-sm mt-1">{fieldErrors.state}</p>
                  )}
                </div>

                {/* Zip Code */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Zip Code <span className="text-error-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.zipCode ? 'border-error-500' : 'border-neutral-300'
                    }`}
                    placeholder="95814"
                    maxLength={5}
                    disabled={isSubmitting}
                  />
                  {fieldErrors.zipCode && (
                    <p className="text-error-600 text-sm mt-1">{fieldErrors.zipCode}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Deal Information Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
                Deal Information
              </h3>
            </div>
            <div className="space-y-4">
              {/* Purchase Price */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Expected Purchase Price <span className="text-error-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                    $
                  </span>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '')
                      setPrice(value)
                    }}
                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.price ? 'border-error-500' : 'border-neutral-300'
                    }`}
                    placeholder="1,200,000"
                    disabled={isSubmitting}
                  />
                </div>
                {fieldErrors.price && (
                  <p className="text-error-600 text-sm mt-1">{fieldErrors.price}</p>
                )}
              </div>

              {/* Square Feet and Units */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Square Feet */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Property Size (sqft) <span className="text-error-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={squareFeet}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '')
                      setSquareFeet(value)
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.squareFeet ? 'border-error-500' : 'border-neutral-300'
                    }`}
                    placeholder="2,800"
                    disabled={isSubmitting}
                  />
                  {fieldErrors.squareFeet && (
                    <p className="text-error-600 text-sm mt-1">{fieldErrors.squareFeet}</p>
                  )}
                </div>

                {/* Units */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Total Units <span className="text-error-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={units}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      setUnits(value)
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.units ? 'border-error-500' : 'border-neutral-300'
                    }`}
                    placeholder="4"
                    disabled={isSubmitting}
                  />
                  {fieldErrors.units && (
                    <p className="text-error-600 text-sm mt-1">{fieldErrors.units}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Financing Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
                Financing
              </h3>
            </div>
            <div className="space-y-4">
              {/* Purchase Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Purchase Type <span className="text-error-600">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="financed"
                      checked={financingType === 'financed'}
                      onChange={(e) => setFinancingType(e.target.value as 'financed' | 'cash')}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-neutral-700">Financed</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="cash"
                      checked={financingType === 'cash'}
                      onChange={(e) => setFinancingType(e.target.value as 'financed' | 'cash')}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-neutral-700">All Cash</span>
                  </label>
                </div>
              </div>

              {/* Financing Details (only if financed) */}
              {financingType === 'financed' && (
                <div className="space-y-4 pl-4 border-l-2 border-primary-200">
                  {/* Down Payment */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Down Payment <span className="text-error-600">*</span>
                      {downPaymentPercent() && (
                        <span className="text-neutral-500 font-normal ml-1">
                          {downPaymentPercent()}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                        $
                      </span>
                      <input
                        type="text"
                        value={downPayment}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '')
                          setDownPayment(value)
                        }}
                        className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          fieldErrors.downPayment ? 'border-error-500' : 'border-neutral-300'
                        }`}
                        placeholder="240,000"
                        disabled={isSubmitting}
                      />
                    </div>
                    {fieldErrors.downPayment && (
                      <p className="text-error-600 text-sm mt-1">{fieldErrors.downPayment}</p>
                    )}
                  </div>

                  {/* Loan Term and Interest Rate */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Loan Term */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Loan Term <span className="text-error-600">*</span>
                      </label>
                      <select
                        value={loanTerm}
                        onChange={(e) => setLoanTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        disabled={isSubmitting}
                      >
                        <option value="15">15 years</option>
                        <option value="20">20 years</option>
                        <option value="25">25 years</option>
                        <option value="30">30 years</option>
                      </select>
                    </div>

                    {/* Interest Rate */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Interest Rate (%) <span className="text-error-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={loanRate}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '')
                          setLoanRate(value)
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          fieldErrors.loanRate ? 'border-error-500' : 'border-neutral-300'
                        }`}
                        placeholder="5.5"
                        disabled={isSubmitting}
                      />
                      {fieldErrors.loanRate && (
                        <p className="text-error-600 text-sm mt-1">{fieldErrors.loanRate}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}