// src/components/analysis/pdf/sections/PDFPropertyDetails.tsx
'use client'

interface PropertyDetailsData {
  address: string
  city: string
  state: string
  zipCode: string
  purchasePrice: number
  downPayment: number
  loanTerm: number
  interestRate: number
  propertySize: number
  totalUnits: number
  isCashPurchase: boolean
}

interface PDFPropertyDetailsProps {
  data: PropertyDetailsData
  accentColor: string
}

export function PDFPropertyDetails({ data, accentColor }: PDFPropertyDetailsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  return (
    <div className="pdf-section">
      {/* Section Header */}
      <div 
        className="flex items-center gap-2 mb-4 pb-2 border-b-2"
        style={{ borderColor: accentColor }}
      >
        <span className="text-2xl">🏢</span>
        <h2 className="text-xl font-bold text-neutral-900">Property Details</h2>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {/* Location */}
        <div className="col-span-2">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-1">Location</h3>
          <p className="text-base text-neutral-900 font-medium">
            {data.address}
          </p>
          <p className="text-sm text-neutral-600">
            {data.city}, {data.state} {data.zipCode}
          </p>
        </div>

        {/* Purchase Price */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-1">Purchase Price</h3>
          <p className="text-lg font-bold text-neutral-900">
            {formatCurrency(data.purchasePrice)}
          </p>
        </div>

        {/* Down Payment */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-1">
            {data.isCashPurchase ? 'Cash Purchase' : 'Down Payment'}
          </h3>
          <p className="text-lg font-bold text-neutral-900">
            {formatCurrency(data.downPayment)}
          </p>
          {!data.isCashPurchase && (
            <p className="text-sm text-neutral-600">
              {((data.downPayment / data.purchasePrice) * 100).toFixed(1)}% down
            </p>
          )}
        </div>

        {/* Property Size */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-1">Property Size</h3>
          <p className="text-lg font-bold text-neutral-900">
            {formatNumber(data.propertySize)} sq ft
          </p>
        </div>

        {/* Total Units */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-1">Total Units</h3>
          <p className="text-lg font-bold text-neutral-900">
            {data.totalUnits} {data.totalUnits === 1 ? 'Unit' : 'Units'}
          </p>
        </div>

        {/* Financing Details (if not cash) */}
        {!data.isCashPurchase && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-1">Loan Term</h3>
              <p className="text-lg font-bold text-neutral-900">
                {data.loanTerm} Years
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-1">Interest Rate</h3>
              <p className="text-lg font-bold text-neutral-900">
                {data.interestRate.toFixed(3)}%
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}