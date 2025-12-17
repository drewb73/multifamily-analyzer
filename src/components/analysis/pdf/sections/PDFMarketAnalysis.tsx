// src/components/analysis/pdf/sections/PDFMarketAnalysis.tsx
'use client'

interface UnitType {
  type: string
  count: number
  currentRent: number
  marketRent: number
}

interface PDFMarketAnalysisProps {
  unitMix: UnitType[]
  currentGrossIncome: number
  marketGrossIncome: number
  accentColor: string
}

export function PDFMarketAnalysis({ 
  unitMix, 
  currentGrossIncome,
  marketGrossIncome,
  accentColor 
}: PDFMarketAnalysisProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const potentialIncrease = marketGrossIncome - currentGrossIncome
  const upsidePercentage = ((potentialIncrease / currentGrossIncome) * 100)

  return (
    <div className="pdf-section">
      {/* Section Header */}
      <div 
        className="flex items-center gap-2 mb-4 pb-2 border-b-2"
        style={{ borderColor: accentColor }}
      >
        <span className="text-2xl">🎯</span>
        <h2 className="text-xl font-bold text-neutral-900">Market Analysis</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-2">
            Current Annual Income
          </h3>
          <p className="text-2xl font-bold text-neutral-900">
            {formatCurrency(currentGrossIncome)}
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
          <h3 className="text-sm font-semibold text-green-700 uppercase mb-2">
            Market Annual Income
          </h3>
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency(marketGrossIncome)}
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border-2" style={{ borderColor: accentColor }}>
          <h3 className="text-sm font-semibold uppercase mb-2" style={{ color: accentColor }}>
            Upside Potential
          </h3>
          <p className="text-2xl font-bold" style={{ color: accentColor }}>
            {formatCurrency(potentialIncrease)}
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            +{upsidePercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Unit Comparison */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-700 uppercase mb-3">
          Current vs Market Rent Comparison
        </h3>
        <div className="space-y-3">
          {unitMix.map((unit, index) => {
            const rentGap = unit.marketRent - unit.currentRent
            const rentGapPercent = ((rentGap / unit.currentRent) * 100)
            const totalCurrentRent = unit.currentRent * unit.count
            const totalMarketRent = unit.marketRent * unit.count
            const totalGap = totalMarketRent - totalCurrentRent

            return (
              <div key={index} className="border rounded-lg p-4 bg-neutral-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-neutral-900">{unit.type}</h4>
                    <p className="text-sm text-neutral-600">
                      {unit.count} {unit.count === 1 ? 'unit' : 'units'}
                    </p>
                  </div>
                  {rentGap > 0 ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                      +{formatCurrency(rentGap)}/mo upside
                    </span>
                  ) : rentGap < 0 ? (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                      {formatCurrency(rentGap)}/mo below market
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-full">
                      At market rate
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Current Rent</p>
                    <p className="font-bold text-neutral-900">
                      {formatCurrency(unit.currentRent)}/mo
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {formatCurrency(totalCurrentRent)}/mo total
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Market Rent</p>
                    <p className="font-bold text-green-700">
                      {formatCurrency(unit.marketRent)}/mo
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {formatCurrency(totalMarketRent)}/mo total
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Monthly Gap</p>
                    <p className={`font-bold ${rentGap > 0 ? 'text-green-600' : rentGap < 0 ? 'text-red-600' : 'text-neutral-600'}`}>
                      {rentGap > 0 ? '+' : ''}{formatCurrency(rentGap)}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {rentGap > 0 ? '+' : ''}{formatCurrency(totalGap)}/mo total
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Market Positioning */}
      <div className="bg-neutral-50 rounded-lg p-5 border-2" style={{ borderColor: accentColor }}>
        <h3 className="text-sm font-semibold text-neutral-700 uppercase mb-4">
          Market Positioning
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-neutral-700">
                Rent to Market Ratio
              </span>
              <span className="font-bold text-neutral-900">
                {((currentGrossIncome / marketGrossIncome) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-3">
              <div 
                className="h-3 rounded-full transition-all"
                style={{ 
                  width: `${Math.min((currentGrossIncome / marketGrossIncome) * 100, 100)}%`,
                  backgroundColor: accentColor
                }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-300">
            <p className="text-sm text-neutral-700 mb-2">
              <span className="font-semibold">Strategic Opportunity:</span>
            </p>
            <p className="text-sm text-neutral-600">
              {upsidePercentage > 10 ? (
                <>Significant value-add opportunity. Consider property improvements and gradual rent increases to capture {formatCurrency(potentialIncrease)} in additional annual income.</>
              ) : upsidePercentage > 5 ? (
                <>Moderate upside potential. Property is performing reasonably well with room for optimization through tenant turnover and improvements.</>
              ) : upsidePercentage > 0 ? (
                <>Property is near market rates with limited upside. Focus on operational efficiency and tenant retention.</>
              ) : (
                <>Rents exceed market rates. Focus on maintaining property quality and tenant satisfaction to justify premium pricing.</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}