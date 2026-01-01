// src/components/analysis/PropertyDetailsForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { PropertyDetails } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { US_STATES_AND_TERRITORIES } from '@/lib/constants/states'

interface PropertyDetailsFormProps {
  data: PropertyDetails
  onUpdate: (data: PropertyDetails) => void
}

export function PropertyDetailsForm({ data, onUpdate }: PropertyDetailsFormProps) {
  const [formData, setFormData] = useState<PropertyDetails>(data)
  const [isCashPurchase, setIsCashPurchase] = useState(data.isCashPurchase || false)

  // Update parent only when user stops typing (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdate(formData)
    }, 300) // 300ms delay
    
    return () => clearTimeout(timer)
  }, [formData, onUpdate])

  const handleChange = (field: keyof PropertyDetails, value: string | number | boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value 
    }))
  }

  const handleCashPurchaseChange = (isCash: boolean) => {
    setIsCashPurchase(isCash)
    if (isCash) {
      setFormData(prev => ({
        ...prev,
        isCashPurchase: true,
        downPayment: prev.purchasePrice, // Full payment for cash purchase
        loanTerm: 0,
        interestRate: 0
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        isCashPurchase: false,
        downPayment: prev.purchasePrice * 0.2, // Default 20% down
        loanTerm: 30,
        interestRate: 6.5
      }))
    }
  }

  const calculatePricePerUnit = () => {
    if (formData.purchasePrice > 0 && formData.totalUnits > 0) {
      return formData.purchasePrice / formData.totalUnits
    }
    return 0
  }

  const calculatePricePerSqFt = () => {
    if (formData.purchasePrice > 0 && formData.propertySize > 0) {
      return formData.purchasePrice / formData.propertySize
    }
    return 0
  }

  const calculateLoanAmount = () => {
    return formData.purchasePrice - formData.downPayment
  }

  const calculateMonthlyPayment = () => {
    if (isCashPurchase) return 0
    
    const loanAmount = calculateLoanAmount()
    const monthlyRate = (formData.interestRate / 100) / 12
    const months = formData.loanTerm * 12
    
    if (loanAmount > 0 && monthlyRate > 0 && months > 0) {
      return loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / 
             (Math.pow(1 + monthlyRate, months) - 1)
    }
    return 0
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-6">
          Property Details
        </h2>
        <p className="text-neutral-600 mb-6">
          Enter the basic details of the property you're analyzing.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Address Section */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Address</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Street Address *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="input-field"
                placeholder="123 Main St"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="input-field"
                placeholder="Anytown"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                State *
              </label>
              <select
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a state...</option>
                {US_STATES_AND_TERRITORIES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.code} - {state.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                ZIP Code *
              </label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                className="input-field"
                placeholder="12345"
                required
              />
            </div>
          </div>
        </div>

        {/* Purchase Details */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Purchase Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Purchase Price *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-neutral-500">$</span>
                </div>
                <input
                  type="number"
                  value={formData.purchasePrice || ''}
                  onChange={(e) => handleChange('purchasePrice', parseFloat(e.target.value) || 0)}
                  className="input-field pl-7"
                  placeholder="1,000,000"
                  min="0"
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!isCashPurchase}
                  onChange={() => handleCashPurchaseChange(false)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
                />
                <span className="ml-2 text-sm text-neutral-700">Financed</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={isCashPurchase}
                  onChange={() => handleCashPurchaseChange(true)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
                />
                <span className="ml-2 text-sm text-neutral-700">All Cash Purchase</span>
              </label>
            </div>

            {!isCashPurchase && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Down Payment *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-neutral-500">$</span>
                    </div>
                    <input
                      type="number"
                      value={formData.downPayment || ''}
                      onChange={(e) => handleChange('downPayment', parseFloat(e.target.value) || 0)}
                      className="input-field pl-7"
                      placeholder="200,000"
                      min="0"
                      max={formData.purchasePrice}
                      required
                    />
                  </div>
                  {formData.purchasePrice > 0 && (
                    <p className="text-sm text-neutral-500 mt-1">
                      Down Payment: {((formData.downPayment / formData.purchasePrice) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Loan Details (only show if not cash purchase) */}
        {!isCashPurchase && (
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Loan Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Loan Term (Years) *
                </label>
                <select
                  value={formData.loanTerm}
                  onChange={(e) => handleChange('loanTerm', parseInt(e.target.value))}
                  className="input-field"
                  required
                >
                  <option value={15}>15 years</option>
                  <option value={20}>20 years</option>
                  <option value={25}>25 years</option>
                  <option value={30}>30 years</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Interest Rate (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.interestRate}
                    onChange={(e) => handleChange('interestRate', parseFloat(e.target.value) || 0)}
                    className="input-field pr-8"
                    placeholder="6.5"
                    step="0.1"
                    min="0"
                    max="20"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-neutral-500">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Property Details */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Property Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Total Square Feet *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.propertySize || ''}
                  onChange={(e) => handleChange('propertySize', parseFloat(e.target.value) || 0)}
                  className="input-field pr-12"
                  placeholder="10,000"
                  min="0"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-neutral-500">sq ft</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Total Units *
              </label>
              <input
                type="number"
                value={formData.totalUnits || ''}
                onChange={(e) => handleChange('totalUnits', parseInt(e.target.value) || 0)}
                className="input-field"
                placeholder="12"
                min="1"
                required
              />
            </div>
          </div>
        </div>

        {/* Calculations Preview */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Quick Calculations</h3>
          <div className="space-y-3 p-4 bg-neutral-50 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Loan Amount:</span>
              <span className="text-sm font-medium text-neutral-900">
                {isCashPurchase ? 'Cash Purchase' : formatCurrency(calculateLoanAmount())}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Price per Unit:</span>
              <span className="text-sm font-medium text-neutral-900">
                {formatCurrency(calculatePricePerUnit())}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Price per Sq Ft:</span>
              <span className="text-sm font-medium text-neutral-900">
                {formatCurrency(calculatePricePerSqFt())}
              </span>
            </div>
            {!isCashPurchase && (
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Monthly Payment:</span>
                <span className="text-sm font-medium text-neutral-900">
                  {formatCurrency(calculateMonthlyPayment())}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}