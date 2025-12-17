// src/components/analysis/pdf/sections/PDFFinancingDetails.tsx
'use client'

interface FinancingData {
  purchasePrice: number
  downPayment: number
  loanAmount: number
  interestRate: number
  loanTerm: number
  monthlyPayment: number
  totalInterest: number
  debtServiceCoverageRatio: number
}

interface PDFFinancingDetailsProps {
  data: FinancingData
  accentColor: string
}

export function PDFFinancingDetails({ data, accentColor }: PDFFinancingDetailsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const downPaymentPercent = (data.downPayment / data.purchasePrice) * 100
  const totalPayments = data.monthlyPayment * data.loanTerm * 12
  const principalPaidFirstYear = data.monthlyPayment * 12 - (data.loanAmount * (data.interestRate / 100))
  const interestPaidFirstYear = (data.monthlyPayment * 12) - principalPaidFirstYear

  return (
    <div className="pdf-section">
      {/* Section Header */}
      <div 
        className="flex items-center gap-2 mb-4 pb-2 border-b-2"
        style={{ borderColor: accentColor }}
      >
        <span className="text-2xl">🏦</span>
        <h2 className="text-xl font-bold text-neutral-900">Financing Details</h2>
      </div>

      {/* Loan Overview */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-2">
            Loan Amount
          </h3>
          <p className="text-2xl font-bold text-neutral-900">
            {formatCurrency(data.loanAmount)}
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            {(100 - downPaymentPercent).toFixed(1)}% of purchase price
          </p>
        </div>

        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-2">
            Down Payment
          </h3>
          <p className="text-2xl font-bold text-neutral-900">
            {formatCurrency(data.downPayment)}
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            {downPaymentPercent.toFixed(1)}% down
          </p>
        </div>

        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-2">
            Interest Rate
          </h3>
          <p className="text-2xl font-bold text-neutral-900">
            {data.interestRate.toFixed(3)}%
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            Fixed rate
          </p>
        </div>

        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-2">
            Loan Term
          </h3>
          <p className="text-2xl font-bold text-neutral-900">
            {data.loanTerm} Years
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            {data.loanTerm * 12} payments
          </p>
        </div>
      </div>

      {/* Monthly Payment */}
      <div className="mb-6 bg-neutral-50 rounded-lg p-5 border-2" style={{ borderColor: accentColor }}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 uppercase mb-1">
              Monthly Payment (P&I)
            </h3>
            <p className="text-xs text-neutral-600">
              Principal & Interest only
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: accentColor }}>
              {formatCurrency(data.monthlyPayment)}
            </p>
          </div>
        </div>
      </div>

      {/* Loan Summary */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-700 uppercase">
          Loan Summary
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between items-center py-2 border-b border-neutral-200">
            <span className="text-sm text-neutral-700">Total Payments</span>
            <span className="font-semibold text-neutral-900">
              {formatCurrency(totalPayments)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-neutral-200">
            <span className="text-sm text-neutral-700">Total Interest</span>
            <span className="font-semibold text-neutral-900">
              {formatCurrency(data.totalInterest)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-neutral-200">
            <span className="text-sm text-neutral-700">DSCR</span>
            <span className="font-semibold text-neutral-900">
              {data.debtServiceCoverageRatio.toFixed(2)}x
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-neutral-200">
            <span className="text-sm text-neutral-700">Annual Debt Service</span>
            <span className="font-semibold text-neutral-900">
              {formatCurrency(data.monthlyPayment * 12)}
            </span>
          </div>
        </div>
      </div>

      {/* First Year Breakdown */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">
          First Year Payment Breakdown
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-blue-700 mb-1">Principal Paid</p>
            <p className="text-lg font-bold text-blue-900">
              {formatCurrency(principalPaidFirstYear)}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-700 mb-1">Interest Paid</p>
            <p className="text-lg font-bold text-blue-900">
              {formatCurrency(interestPaidFirstYear)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}