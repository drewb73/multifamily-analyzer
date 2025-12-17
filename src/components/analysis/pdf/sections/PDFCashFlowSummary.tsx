// src/components/analysis/pdf/sections/PDFCashFlowSummary.tsx
'use client'

interface CashFlowData {
  monthlyGrossIncome: number
  monthlyExpenses: number
  monthlyNOI: number
  monthlyMortgage: number
  monthlyCashFlow: number
  annualGrossIncome: number
  annualExpenses: number
  annualNOI: number
  annualDebtService: number
  annualCashFlow: number
}

interface PDFCashFlowSummaryProps {
  data: CashFlowData
  accentColor: string
  isCashPurchase: boolean
}

export function PDFCashFlowSummary({ data, accentColor, isCashPurchase }: PDFCashFlowSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="pdf-section">
      {/* Section Header */}
      <div 
        className="flex items-center gap-2 mb-4 pb-2 border-b-2"
        style={{ borderColor: accentColor }}
      >
        <span className="text-2xl">💵</span>
        <h2 className="text-xl font-bold text-neutral-900">Cash Flow Summary</h2>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Monthly Cash Flow */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-700 mb-4">Monthly</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-neutral-700">Gross Income</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(data.monthlyGrossIncome)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-neutral-700">Operating Expenses</span>
              <span className="font-semibold text-red-600">
                -{formatCurrency(data.monthlyExpenses)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
              <span className="font-medium text-neutral-700">Net Operating Income</span>
              <span className="font-bold text-neutral-900">
                {formatCurrency(data.monthlyNOI)}
              </span>
            </div>

            {!isCashPurchase && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-700">Mortgage Payment</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(data.monthlyMortgage)}
                </span>
              </div>
            )}

            <div 
              className="flex justify-between items-center pt-3 border-t-2 mt-2"
              style={{ borderColor: accentColor }}
            >
              <span className="font-bold text-neutral-900">Monthly Cash Flow</span>
              <span className="text-xl font-bold" style={{ color: accentColor }}>
                {formatCurrency(data.monthlyCashFlow)}
              </span>
            </div>
          </div>
        </div>

        {/* Annual Cash Flow */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-700 mb-4">Annual</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-neutral-700">Gross Income</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(data.annualGrossIncome)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-neutral-700">Operating Expenses</span>
              <span className="font-semibold text-red-600">
                -{formatCurrency(data.annualExpenses)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
              <span className="font-medium text-neutral-700">Net Operating Income</span>
              <span className="font-bold text-neutral-900">
                {formatCurrency(data.annualNOI)}
              </span>
            </div>

            {!isCashPurchase && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-700">Debt Service</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(data.annualDebtService)}
                </span>
              </div>
            )}

            <div 
              className="flex justify-between items-center pt-3 border-t-2 mt-2"
              style={{ borderColor: accentColor }}
            >
              <span className="font-bold text-neutral-900">Annual Cash Flow</span>
              <span className="text-xl font-bold" style={{ color: accentColor }}>
                {formatCurrency(data.annualCashFlow)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Note */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Note:</span> This cash flow projection is based on current rents and expenses. 
          Actual results may vary based on occupancy, market conditions, and unexpected costs.
        </p>
      </div>
    </div>
  )
}