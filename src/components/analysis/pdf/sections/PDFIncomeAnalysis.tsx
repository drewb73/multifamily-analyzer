// src/components/analysis/pdf/sections/PDFIncomeAnalysis.tsx
'use client'

interface UnitType {
  type: string
  count: number
  currentRent: number
  marketRent: number
}

interface IncomeCategory {
  name: string
  amount: number
}

interface PDFIncomeAnalysisProps {
  unitMix: UnitType[]
  otherIncome: IncomeCategory[]
  vacancyRate: number
  grossIncome: number
  effectiveGrossIncome: number
  accentColor: string
}

export function PDFIncomeAnalysis({ 
  unitMix, 
  otherIncome, 
  vacancyRate,
  grossIncome,
  effectiveGrossIncome,
  accentColor 
}: PDFIncomeAnalysisProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const totalRentalIncome = unitMix.reduce((sum, unit) => 
    sum + (unit.currentRent * unit.count * 12), 0
  )

  const totalOtherIncome = otherIncome.reduce((sum, cat) => sum + (cat.amount * 12), 0)
  const vacancyLoss = grossIncome * (vacancyRate / 100)

  return (
    <div className="pdf-section">
      {/* Section Header */}
      <div 
        className="flex items-center gap-2 mb-4 pb-2 border-b-2"
        style={{ borderColor: accentColor }}
      >
        <span className="text-2xl">💰</span>
        <h2 className="text-xl font-bold text-neutral-900">Income Analysis</h2>
      </div>

      {/* Rental Income */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-700 uppercase mb-3">
          Rental Income (Annual)
        </h3>
        <div className="space-y-2">
          {unitMix.map((unit, index) => {
            const annualIncome = unit.currentRent * unit.count * 12
            return (
              <div key={index} className="flex justify-between items-center py-2 border-b border-neutral-100">
                <div>
                  <span className="font-medium text-neutral-900">
                    {unit.type}
                  </span>
                  <span className="text-sm text-neutral-600 ml-2">
                    ({unit.count} {unit.count === 1 ? 'unit' : 'units'} × {formatCurrency(unit.currentRent)}/mo)
                  </span>
                </div>
                <span className="font-semibold text-neutral-900">
                  {formatCurrency(annualIncome)}
                </span>
              </div>
            )
          })}
          <div className="flex justify-between items-center py-2 font-semibold">
            <span className="text-neutral-700">Total Rental Income</span>
            <span className="text-neutral-900">{formatCurrency(totalRentalIncome)}</span>
          </div>
        </div>
      </div>

      {/* Other Income */}
      {otherIncome.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 uppercase mb-3">
            Other Income (Annual)
          </h3>
          <div className="space-y-2">
            {otherIncome.map((income, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="font-medium text-neutral-900">{income.name}</span>
                <span className="font-semibold text-neutral-900">
                  {formatCurrency(income.amount * 12)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-neutral-50 rounded-lg p-4 border-2" style={{ borderColor: accentColor }}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-neutral-700">Gross Annual Income</span>
            <span className="text-lg font-bold text-neutral-900">
              {formatCurrency(grossIncome)}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-red-600">
            <span className="font-semibold">
              Vacancy Loss ({vacancyRate}%)
            </span>
            <span className="text-lg font-bold">
              -{formatCurrency(vacancyLoss)}
            </span>
          </div>

          <div className="pt-3 border-t-2 border-neutral-300 flex justify-between items-center">
            <span className="font-bold text-neutral-900">Effective Gross Income</span>
            <span className="text-xl font-bold" style={{ color: accentColor }}>
              {formatCurrency(effectiveGrossIncome)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}