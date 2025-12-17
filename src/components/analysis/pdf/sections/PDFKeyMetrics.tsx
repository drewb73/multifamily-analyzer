// src/components/analysis/pdf/sections/PDFKeyMetrics.tsx
'use client'

interface KeyMetricsData {
  capRate: number
  cashOnCashReturn: number
  netOperatingIncome: number
  grossRentMultiplier: number
  debtServiceCoverageRatio: number
  totalInvestment: number
  annualCashFlow: number
}

interface PDFKeyMetricsProps {
  data: KeyMetricsData
  accentColor: string
  isCashPurchase: boolean
}

export function PDFKeyMetrics({ data, accentColor, isCashPurchase }: PDFKeyMetricsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    // Value is a decimal (e.g., 0.0335), convert to percentage (3.35%)
    return `${(value * 100).toFixed(2)}%`
  }

  return (
    <div className="pdf-section">
      {/* Section Header */}
      <div 
        className="flex items-center gap-2 mb-4 pb-2 border-b-2"
        style={{ borderColor: accentColor }}
      >
        <span className="text-2xl">📊</span>
        <h2 className="text-xl font-bold text-neutral-900">Key Metrics</h2>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Cap Rate */}
        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-2">
            Cap Rate
          </h3>
          <p className="text-2xl font-bold" style={{ color: accentColor }}>
            {formatPercent(data.capRate)}
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            Net Operating Income / Purchase Price
          </p>
        </div>

        {/* Cash on Cash Return */}
        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-2">
            Cash on Cash Return
          </h3>
          <p className="text-2xl font-bold" style={{ color: accentColor }}>
            {formatPercent(data.cashOnCashReturn)}
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            Annual Cash Flow / Total Investment
          </p>
        </div>

        {/* NOI */}
        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-2">
            Net Operating Income
          </h3>
          <p className="text-2xl font-bold text-neutral-900">
            {formatCurrency(data.netOperatingIncome)}
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            Per year
          </p>
        </div>

        {/* Annual Cash Flow */}
        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-2">
            Annual Cash Flow
          </h3>
          <p className="text-2xl font-bold text-neutral-900">
            {formatCurrency(data.annualCashFlow)}
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            After debt service
          </p>
        </div>

        {/* GRM */}
        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-2">
            Gross Rent Multiplier
          </h3>
          <p className="text-2xl font-bold text-neutral-900">
            {data.grossRentMultiplier.toFixed(2)}
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            Purchase Price / Gross Annual Income
          </p>
        </div>

        {/* DSCR */}
        {!isCashPurchase && (
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-2">
              Debt Service Coverage
            </h3>
            <p className="text-2xl font-bold text-neutral-900">
              {data.debtServiceCoverageRatio.toFixed(2)}x
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              NOI / Annual Debt Service
            </p>
          </div>
        )}
      </div>
    </div>
  )
}