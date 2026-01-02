// src/components/analysis/pdf/sections/PDFIncomeExpensePL.tsx
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

interface ExpenseCategory {
  name: string
  amount: number
  isPercentage: boolean
  percentageOf?: 'income' | 'propertyValue' | 'rent'
}

interface PDFIncomeExpensePLProps {
  // Income data
  unitMix: UnitType[]
  otherIncome: IncomeCategory[]
  vacancyRate: number
  grossIncome: number
  effectiveGrossIncome: number
  
  // Expense data
  expenses: ExpenseCategory[]
  totalMonthlyExpenses: number
  totalAnnualExpenses: number
  purchasePrice?: number
  monthlyGrossIncome?: number
  monthlyRentalIncome?: number
  
  // Results
  netOperatingIncome: number
  debtService?: number
  cashFlow?: number
  isCashPurchase: boolean
  
  accentColor: string
}

export function PDFIncomeExpensePL({ 
  unitMix, 
  otherIncome, 
  vacancyRate,
  grossIncome,
  effectiveGrossIncome,
  expenses,
  totalAnnualExpenses,
  purchasePrice = 0,
  monthlyGrossIncome = 0,
  monthlyRentalIncome = 0,
  netOperatingIncome,
  debtService = 0,
  cashFlow = 0,
  isCashPurchase,
  accentColor 
}: PDFIncomeExpensePLProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Group units by type and sum their annual income
  const groupedUnits = unitMix.reduce((acc, unit) => {
    const annualIncome = unit.currentRent * unit.count * 12
    
    if (acc[unit.type]) {
      acc[unit.type].totalUnits += unit.count
      acc[unit.type].totalAnnualIncome += annualIncome
    } else {
      acc[unit.type] = {
        type: unit.type,
        totalUnits: unit.count,
        totalAnnualIncome: annualIncome
      }
    }
    
    return acc
  }, {} as Record<string, { type: string; totalUnits: number; totalAnnualIncome: number }>)

  // Convert to array for rendering
  const groupedUnitsArray = Object.values(groupedUnits)

  const totalRentalIncome = unitMix.reduce((sum, unit) => 
    sum + (unit.currentRent * unit.count * 12), 0
  )
  const totalOtherIncome = otherIncome.reduce((sum, cat) => sum + (cat.amount * 12), 0)
  const vacancyLoss = grossIncome * (vacancyRate / 100)

  return (
    <div className="pdf-section">
      {/* Section Header */}
      <div 
        className="flex items-center gap-2 mb-3 pb-2 border-b-2"
        style={{ borderColor: accentColor }}
      >
        <span className="text-2xl">📊</span>
        <h2 className="text-xl font-bold text-neutral-900">Income & Expense Statement</h2>
      </div>

      {/* INCOME SECTION */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-neutral-800 mb-2 uppercase">Income</h3>
        
        {/* Rental Income Items - GROUPED BY TYPE */}
        <div className="space-y-1 ml-3">
          {groupedUnitsArray.map((group, index) => {
            return (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-neutral-700">
                  {group.type} ({group.totalUnits} {group.totalUnits === 1 ? 'unit' : 'units'})
                </span>
                <span className="text-neutral-900 font-medium">
                  {formatCurrency(group.totalAnnualIncome)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Other Income Items */}
        {otherIncome.length > 0 && (
          <div className="space-y-1 ml-3 mt-1">
            {otherIncome.map((income, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-neutral-700">{income.name}</span>
                <span className="text-neutral-900 font-medium">
                  {formatCurrency(income.amount * 12)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Gross Income */}
        <div className="flex justify-between mt-2 pt-2 border-t border-neutral-200">
          <span className="font-semibold text-neutral-800">Gross Income</span>
          <span className="font-bold text-neutral-900">{formatCurrency(grossIncome)}</span>
        </div>

        {/* Vacancy Loss */}
        <div className="flex justify-between text-sm mt-1 text-red-600">
          <span className="ml-3">Less: Vacancy ({vacancyRate}%)</span>
          <span className="font-medium">({formatCurrency(vacancyLoss)})</span>
        </div>

        {/* Effective Gross Income */}
        <div 
          className="flex justify-between mt-2 pt-2 border-t-2 font-bold"
          style={{ borderColor: accentColor }}
        >
          <span className="text-neutral-900">Effective Gross Income</span>
          <span style={{ color: accentColor }}>{formatCurrency(effectiveGrossIncome)}</span>
        </div>
      </div>

      {/* EXPENSE SECTION */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-neutral-800 mb-2 uppercase">Operating Expenses</h3>
        
        <div className="space-y-1 ml-3">
          {expenses.map((expense, index) => {
            // Calculate monthly amount
            let monthlyAmount: number
            
            if (expense.isPercentage) {
              if (expense.percentageOf === 'propertyValue') {
                monthlyAmount = (purchasePrice * (expense.amount / 100)) / 12
              } else if (expense.percentageOf === 'rent') {
                monthlyAmount = monthlyRentalIncome * (expense.amount / 100)
              } else {
                monthlyAmount = monthlyGrossIncome * (expense.amount / 100)
              }
            } else {
              monthlyAmount = expense.amount
            }
            
            const annualAmount = monthlyAmount * 12

            return (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-neutral-700">{expense.name}</span>
                <span className="text-neutral-900 font-medium">
                  {formatCurrency(annualAmount)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Total Expenses */}
        <div className="flex justify-between mt-2 pt-2 border-t border-neutral-200 font-semibold">
          <span className="text-neutral-800">Total Operating Expenses</span>
          <span className="text-neutral-900">{formatCurrency(totalAnnualExpenses)}</span>
        </div>
      </div>

      {/* NET OPERATING INCOME */}
      <div 
        className="flex justify-between py-2 px-3 bg-neutral-50 rounded border-2 font-bold mb-3"
        style={{ borderColor: accentColor }}
      >
        <span className="text-neutral-900">Net Operating Income (NOI)</span>
        <span style={{ color: accentColor }}>{formatCurrency(netOperatingIncome)}</span>
      </div>

      {/* DEBT SERVICE (if applicable) */}
      {!isCashPurchase && debtService > 0 && (
        <>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutral-700">Less: Debt Service</span>
            <span className="text-neutral-900 font-medium">
              ({formatCurrency(debtService)})
            </span>
          </div>

          {/* CASH FLOW */}
          <div 
            className="flex justify-between py-2 px-3 rounded border-2 font-bold"
            style={{ 
              backgroundColor: cashFlow >= 0 ? '#f0fdf4' : '#fef2f2',
              borderColor: cashFlow >= 0 ? '#22c55e' : '#ef4444',
              color: cashFlow >= 0 ? '#16a34a' : '#dc2626'
            }}
          >
            <span>Annual Cash Flow</span>
            <span>{formatCurrency(cashFlow)}</span>
          </div>
        </>
      )}

      {/* Note */}
      <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
        <p className="text-xs text-yellow-800">
          <span className="font-semibold">Note:</span> All figures are annual estimates. 
          Actual results may vary based on occupancy, market conditions, and unforeseen expenses.
        </p>
      </div>
    </div>
  )
}