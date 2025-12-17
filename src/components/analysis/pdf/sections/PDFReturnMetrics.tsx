// src/components/analysis/pdf/sections/PDFReturnMetrics.tsx
'use client'

interface ReturnMetricsData {
  capRate: number
  cashOnCashReturn: number
  annualCashFlow: number
  totalInvestment: number
  netOperatingIncome: number
  purchasePrice: number
}

interface PDFReturnMetricsProps {
  data: ReturnMetricsData
  accentColor: string
  isCashPurchase: boolean
}

export function PDFReturnMetrics({ data, accentColor, isCashPurchase }: PDFReturnMetricsProps) {
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

  // Calculate ROI - same as Cash on Cash for year 1
  // (In future could add appreciation, tax benefits, etc.)
  const roi = data.cashOnCashReturn
  
  // Calculate payback period (years)
  const paybackPeriod = data.annualCashFlow > 0 
    ? data.totalInvestment / data.annualCashFlow 
    : 0

  // Project 5-year returns
  const fiveYearCashFlow = data.annualCashFlow * 5
  const fiveYearROI = data.totalInvestment > 0
    ? (fiveYearCashFlow / data.totalInvestment)
    : 0

  return (
    <div className="pdf-section">
      {/* Section Header */}
      <div 
        className="flex items-center gap-2 mb-4 pb-2 border-b-2"
        style={{ borderColor: accentColor }}
      >
        <span className="text-2xl">📈</span>
        <h2 className="text-xl font-bold text-neutral-900">Return Metrics</h2>
      </div>

      {/* Key Return Metrics */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border-2 border-green-200">
          <h3 className="text-sm font-semibold text-green-700 uppercase mb-2">
            Cap Rate
          </h3>
          <p className="text-3xl font-bold text-green-900">
            {formatPercent(data.capRate)}
          </p>
          <p className="text-xs text-green-700 mt-2">
            NOI / Purchase Price
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border-2 border-blue-200">
          <h3 className="text-sm font-semibold text-blue-700 uppercase mb-2">
            Cash on Cash Return
          </h3>
          <p className="text-3xl font-bold text-blue-900">
            {formatPercent(data.cashOnCashReturn)}
          </p>
          <p className="text-xs text-blue-700 mt-2">
            Annual Cash Flow / {isCashPurchase ? 'Purchase Price' : 'Down Payment'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border-2 border-purple-200">
          <h3 className="text-sm font-semibold text-purple-700 uppercase mb-2">
            Return on Investment
          </h3>
          <p className="text-3xl font-bold text-purple-900">
            {formatPercent(roi)}
          </p>
          <p className="text-xs text-purple-700 mt-2">
            First year cash return
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-5 border-2 border-orange-200">
          <h3 className="text-sm font-semibold text-orange-700 uppercase mb-2">
            Payback Period
          </h3>
          <p className="text-3xl font-bold text-orange-900">
            {paybackPeriod > 0 && paybackPeriod < 100 
              ? `${paybackPeriod.toFixed(1)} yrs` 
              : 'N/A'}
          </p>
          <p className="text-xs text-orange-700 mt-2">
            {paybackPeriod > 0 && paybackPeriod < 100
              ? 'Time to recover investment'
              : data.annualCashFlow <= 0 
                ? 'Negative cash flow' 
                : 'Very long payback'}
          </p>
        </div>
      </div>

      {/* Investment Summary */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-700 uppercase mb-3">
          Investment Summary
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-neutral-200">
            <span className="text-neutral-700">Total Investment</span>
            <span className="font-bold text-neutral-900">
              {formatCurrency(data.totalInvestment)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-neutral-200">
            <span className="text-neutral-700">Annual Cash Flow</span>
            <span className={`font-bold ${data.annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.annualCashFlow)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-neutral-200">
            <span className="text-neutral-700">Net Operating Income</span>
            <span className="font-bold text-neutral-900">
              {formatCurrency(data.netOperatingIncome)}
            </span>
          </div>
        </div>
      </div>

      {/* 5-Year Projection */}
      <div className="bg-neutral-50 rounded-lg p-5 border-2" style={{ borderColor: accentColor }}>
        <h3 className="text-sm font-semibold text-neutral-700 uppercase mb-4">
          5-Year Projection
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-neutral-600 mb-1">
              Total Cash Flow
            </p>
            <p className="text-2xl font-bold" style={{ color: accentColor }}>
              {formatCurrency(fiveYearCashFlow)}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 mb-1">
              5-Year ROI
            </p>
            <p className="text-2xl font-bold" style={{ color: accentColor }}>
              {formatPercent(fiveYearROI)}
            </p>
          </div>
        </div>
        <p className="text-xs text-neutral-600 mt-3">
          Based on current cash flow, assuming no appreciation or rent increases
        </p>
      </div>

      {/* Performance Indicator */}
      <div className={`mt-6 p-4 rounded-lg border ${
        data.cashOnCashReturn >= 0.08 
          ? 'bg-green-50 border-green-200' 
          : data.cashOnCashReturn >= 0.05 
          ? 'bg-yellow-50 border-yellow-200'
          : data.cashOnCashReturn >= 0
          ? 'bg-orange-50 border-orange-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">
            {data.cashOnCashReturn >= 0.08 
              ? '✓' 
              : data.cashOnCashReturn >= 0.05 
              ? '→' 
              : data.cashOnCashReturn >= 0
              ? '⚠'
              : '!'}
          </span>
          <div>
            <p className={`font-semibold mb-1 ${
              data.cashOnCashReturn >= 0.08 
                ? 'text-green-900' 
                : data.cashOnCashReturn >= 0.05 
                ? 'text-yellow-900'
                : data.cashOnCashReturn >= 0
                ? 'text-orange-900'
                : 'text-red-900'
            }`}>
              Investment Performance
            </p>
            <p className={`text-sm ${
              data.cashOnCashReturn >= 0.08 
                ? 'text-green-800' 
                : data.cashOnCashReturn >= 0.05 
                ? 'text-yellow-800'
                : data.cashOnCashReturn >= 0
                ? 'text-orange-800'
                : 'text-red-800'
            }`}>
              {data.cashOnCashReturn >= 0.08 ? (
                <>Strong cash-on-cash return above 8% target. This property demonstrates solid income potential.</>
              ) : data.cashOnCashReturn >= 0.05 ? (
                <>Moderate cash-on-cash return between 5-8%. Consider opportunities for value-add improvements.</>
              ) : data.cashOnCashReturn >= 0 ? (
                <>Below typical 5% target. May be suitable for appreciation play or requires operational improvements.</>
              ) : (
                <>Negative cash flow. Property requires significant improvements or better market conditions to become profitable.</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}