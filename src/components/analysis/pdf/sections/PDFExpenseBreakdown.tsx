// src/components/analysis/pdf/sections/PDFExpenseBreakdown.tsx
'use client'

interface ExpenseCategory {
  name: string
  amount: number
  isPercentage: boolean
  percentageOf?: 'income' | 'propertyValue' | 'rent'
}

interface PDFExpenseBreakdownProps {
  expenses: ExpenseCategory[]
  totalMonthlyExpenses: number
  totalAnnualExpenses: number
  accentColor: string
  purchasePrice?: number
  monthlyGrossIncome?: number  // ADD THIS - for rent/income based percentages
}

export function PDFExpenseBreakdown({ 
  expenses, 
  totalMonthlyExpenses,
  totalAnnualExpenses,
  accentColor,
  purchasePrice = 0,
  monthlyGrossIncome = 0  // ADD THIS
}: PDFExpenseBreakdownProps) {
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
        <span className="text-2xl">💸</span>
        <h2 className="text-xl font-bold text-neutral-900">Expense Breakdown</h2>
      </div>

      {/* Expense Categories */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-700 uppercase mb-3">
          Operating Expenses
        </h3>
        <div className="space-y-2">
          {expenses.map((expense, index) => {
            // Calculate monthly amount based on expense type
            let monthlyAmount: number
            
            if (expense.isPercentage) {
              if (expense.percentageOf === 'propertyValue') {
                // Calculate from purchase price
                // expense.amount is the percentage (e.g., 1 for 1%)
                monthlyAmount = (purchasePrice * (expense.amount / 100)) / 12
              } else if (expense.percentageOf === 'rent' || expense.percentageOf === 'income') {
                // Calculate from monthly gross income
                // expense.amount is the percentage (e.g., 10 for 10%)
                monthlyAmount = monthlyGrossIncome * (expense.amount / 100)
              } else {
                // Fallback - shouldn't happen
                monthlyAmount = expense.amount
              }
            } else {
              // Fixed dollar amount
              monthlyAmount = expense.amount
            }
            
            const annualAmount = monthlyAmount * 12

            return (
              <div 
                key={index} 
                className="flex justify-between items-center py-2 border-b border-neutral-100"
              >
                <div>
                  <span className="font-medium text-neutral-900">
                    {expense.name}
                  </span>
                  {expense.isPercentage && (
                    <span className="text-xs text-neutral-500 ml-2">
                      ({expense.amount}% of {
                        expense.percentageOf === 'propertyValue' 
                          ? 'property value' 
                          : expense.percentageOf === 'rent'
                          ? 'rental income'
                          : 'total income'
                      })
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-neutral-900">
                    {formatCurrency(monthlyAmount)}/mo
                  </div>
                  <div className="text-sm text-neutral-600">
                    {formatCurrency(annualAmount)}/yr
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Totals Summary */}
      <div className="bg-neutral-50 rounded-lg p-4 border-2" style={{ borderColor: accentColor }}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-neutral-900">Total Monthly Expenses</span>
            <span className="text-xl font-bold" style={{ color: accentColor }}>
              {formatCurrency(totalMonthlyExpenses)}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-neutral-300">
            <span className="font-bold text-neutral-900">Total Annual Expenses</span>
            <span className="text-xl font-bold" style={{ color: accentColor }}>
              {formatCurrency(totalAnnualExpenses)}
            </span>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <span className="font-semibold">Note:</span> Expenses are based on current estimates. 
          Actual costs may vary based on property condition, market rates, and unforeseen repairs.
        </p>
      </div>
    </div>
  )
}