'use client'

import { AnalysisInputs, AnalysisResults as AnalysisResultsType } from '@/types'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { Card, Button } from '@/components'

interface AnalysisResultsProps {
  inputs: AnalysisInputs
  results: AnalysisResultsType
}

export function AnalysisResults({ inputs, results }: AnalysisResultsProps) {
  const isCashPurchase = inputs.property.isCashPurchase
  
  // Find vacancy expense for display
  const vacancyExpense = inputs.expenses.find(exp => 
    exp.name.toLowerCase().includes('vacancy')
  )
  const vacancyRate = vacancyExpense?.isPercentage ? vacancyExpense.amount : 0
  
  // Find management expense for display
  const managementExpense = inputs.expenses.find(exp => 
    exp.name.toLowerCase().includes('management')
  )
  const managementRate = managementExpense?.isPercentage ? managementExpense.amount : 0

  // Calculation explanations
  const calculations = {
    capRate: {
      formula: "Annual NOI ÷ Purchase Price",
      example: `${formatCurrency(results.annualBreakdown.netOperatingIncome)} ÷ ${formatCurrency(inputs.property.purchasePrice)}`,
      result: formatPercentage(results.keyMetrics.capRate),
      description: "The property's unleveraged return based on its current market value. Measures property performance regardless of financing."
    },
    cashOnCash: {
      formula: "Annual Cash Flow ÷ Down Payment",
      example: `${formatCurrency(results.keyMetrics.annualCashFlow)} ÷ ${formatCurrency(results.keyMetrics.totalInvestment)}`,
      result: formatPercentage(results.keyMetrics.cashOnCashReturn),
      description: "Your actual return on cash invested. Includes the effect of financing (leverage). Higher leverage typically increases this return."
    },
    grossRentMultiplier: {
      formula: "Purchase Price ÷ Annual Gross Rent",
      example: `${formatCurrency(inputs.property.purchasePrice)} ÷ ${formatCurrency(results.annualBreakdown.grossIncome)}`,
      result: `${results.keyMetrics.grossRentMultiplier.toFixed(1)}`,
      description: "How many years of gross rent it would take to pay for the property. Lower numbers indicate better value. Typical range: 8-12 for most markets."
    },
    noi: {
      formula: "Gross Income - Total Expenses",
      example: `${formatCurrency(results.annualBreakdown.grossIncome)} - ${formatCurrency(results.annualBreakdown.totalExpenses)}`,
      result: formatCurrency(results.keyMetrics.netOperatingIncome),
      description: "Net Operating Income - the property's profit before financing costs. This is what the property earns on its own."
    }
  }

  return (
    <div className="space-y-8" id="analysis-results">
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold text-neutral-900 mb-4">
          Analysis Results
        </h2>
        <p className="text-lg text-neutral-600">
          Your property analysis is complete! Here are the key metrics.
        </p>
        {isCashPurchase && (
          <div className="inline-block mt-2 px-4 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
            All Cash Purchase
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {formatPercentage(results.keyMetrics.capRate)}
          </div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">CAP Rate</div>
          <div className="text-sm text-neutral-600">Property's unleveraged return</div>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-secondary-600 mb-2">
            {formatPercentage(results.keyMetrics.cashOnCashReturn)}
          </div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">Cash on Cash</div>
          <div className="text-sm text-neutral-600">Return on cash invested</div>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-accent-600 mb-2">
            {formatCurrency(results.keyMetrics.annualCashFlow)}
          </div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">Annual Cash Flow</div>
          <div className="text-sm text-neutral-600">Yearly profit after expenses</div>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-neutral-600 mb-2">
            {results.keyMetrics.grossRentMultiplier.toFixed(1)}
          </div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">Gross Rent Multiplier</div>
          <div className="text-sm text-neutral-600">Price ÷ Annual Gross Rent</div>
        </Card>
      </div>

      {/* Property Summary */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-neutral-800 mb-4">Property Summary</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-neutral-700 mb-2">Address</h4>
            <p className="text-neutral-900">
              {inputs.property.address}<br />
              {inputs.property.city}, {inputs.property.state} {inputs.property.zipCode}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-neutral-700 mb-2">Financial Details</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-neutral-600">Purchase Price:</div>
              <div className="text-sm font-medium">{formatCurrency(inputs.property.purchasePrice)}</div>
              
              <div className="text-sm text-neutral-600">Purchase Type:</div>
              <div className="text-sm font-medium">
                {isCashPurchase ? 'All Cash' : `Financed (${((inputs.property.downPayment / inputs.property.purchasePrice) * 100).toFixed(1)}% down)`}
              </div>
              
              <div className="text-sm text-neutral-600">Vacancy Rate:</div>
              <div className="text-sm font-medium">{vacancyRate}% of Rent</div>
              
              <div className="text-sm text-neutral-600">Management Fee:</div>
              <div className="text-sm font-medium">{managementRate}% of Rent</div>
              
              {!isCashPurchase && (
                <>
                  <div className="text-sm text-neutral-600">Loan Amount:</div>
                  <div className="text-sm font-medium">
                    {formatCurrency(inputs.property.purchasePrice - inputs.property.downPayment)}
                  </div>
                  
                  <div className="text-sm text-neutral-600">Interest Rate:</div>
                  <div className="text-sm font-medium">{inputs.property.interestRate}%</div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Monthly & Annual Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-neutral-800 mb-4">Monthly Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Gross Income:</span>
              <span className="font-medium">{formatCurrency(results.monthlyBreakdown.grossIncome)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Total Expenses:</span>
              <span className="font-medium text-error-600">-{formatCurrency(results.monthlyBreakdown.totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Net Operating Income:</span>
              <span className="font-medium">{formatCurrency(results.monthlyBreakdown.netOperatingIncome)}</span>
            </div>
            {!isCashPurchase && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Mortgage Payment:</span>
                <span className="font-medium text-error-600">-{formatCurrency(results.monthlyBreakdown.mortgagePayment)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-neutral-200">
              <span className="text-lg font-semibold text-neutral-800">Monthly Cash Flow:</span>
              <span className={`text-lg font-bold ${results.monthlyBreakdown.cashFlow >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {formatCurrency(results.monthlyBreakdown.cashFlow)}
              </span>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-neutral-800 mb-4">Annual Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Gross Income:</span>
              <span className="font-medium">{formatCurrency(results.annualBreakdown.grossIncome)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Total Expenses:</span>
              <span className="font-medium text-error-600">-{formatCurrency(results.annualBreakdown.totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Net Operating Income:</span>
              <span className="font-medium">{formatCurrency(results.annualBreakdown.netOperatingIncome)}</span>
            </div>
            {!isCashPurchase && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Debt Service:</span>
                <span className="font-medium text-error-600">-{formatCurrency(results.annualBreakdown.debtService)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-neutral-200">
              <span className="text-lg font-semibold text-neutral-800">Annual Cash Flow:</span>
              <span className={`text-lg font-bold ${results.annualBreakdown.cashFlow >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {formatCurrency(results.annualBreakdown.cashFlow)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Calculation Breakdown */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-neutral-800 mb-4">How These Numbers Are Calculated</h3>
        <div className="space-y-6">
          {/* CAP Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-primary-700">CAP Rate</h4>
              <span className="text-lg font-bold text-primary-600">{formatPercentage(results.keyMetrics.capRate)}</span>
            </div>
            <div className="bg-primary-50 p-4 rounded-lg">
              <div className="font-mono text-sm mb-1">Formula: {calculations.capRate.formula}</div>
              <div className="font-mono text-sm mb-2">Calculation: {calculations.capRate.example}</div>
              <p className="text-sm text-primary-700">{calculations.capRate.description}</p>
            </div>
          </div>

          {/* Cash on Cash Return */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-secondary-700">Cash on Cash Return</h4>
              <span className="text-lg font-bold text-secondary-600">{formatPercentage(results.keyMetrics.cashOnCashReturn)}</span>
            </div>
            <div className="bg-secondary-50 p-4 rounded-lg">
              <div className="font-mono text-sm mb-1">Formula: {calculations.cashOnCash.formula}</div>
              <div className="font-mono text-sm mb-2">Calculation: {calculations.cashOnCash.example}</div>
              <p className="text-sm text-secondary-700">{calculations.cashOnCash.description}</p>
            </div>
          </div>

          {/* Gross Rent Multiplier */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-neutral-700">Gross Rent Multiplier (GRM)</h4>
              <span className="text-lg font-bold text-neutral-600">{calculations.grossRentMultiplier.result}</span>
            </div>
            <div className="bg-neutral-50 p-4 rounded-lg">
              <div className="font-mono text-sm mb-1">Formula: {calculations.grossRentMultiplier.formula}</div>
              <div className="font-mono text-sm mb-2">Calculation: {calculations.grossRentMultiplier.example}</div>
              <p className="text-sm text-neutral-700">{calculations.grossRentMultiplier.description}</p>
            </div>
          </div>

          {/* NOI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-accent-700">Annual Net Operating Income (NOI)</h4>
              <span className="text-lg font-bold text-accent-600">{formatCurrency(results.keyMetrics.netOperatingIncome)}</span>
            </div>
            <div className="bg-accent-50 p-4 rounded-lg">
              <div className="font-mono text-sm mb-1">Formula: {calculations.noi.formula}</div>
              <div className="font-mono text-sm mb-2">Calculation: {calculations.noi.example}</div>
              <p className="text-sm text-accent-700">{calculations.noi.description}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-primary-50 rounded-lg">
          <h4 className="font-semibold text-primary-800 mb-2">Key Takeaways:</h4>
          <ul className="text-sm text-primary-700 space-y-1">
            <li>• <strong>CAP Rate</strong> measures the property's performance regardless of how it's financed</li>
            <li>• <strong>Cash on Cash</strong> measures your personal return on the cash you invested</li>
            <li>• <strong>Gross Rent Multiplier (GRM)</strong> tells you how many years of gross rent would pay for the property</li>
            <li>• <strong>Lower GRM</strong> indicates better value (typical range: 8-12)</li>
            <li>• Leverage (mortgage) typically increases Cash on Cash but adds risk</li>
            <li>• A positive Cash Flow means the property pays for itself each month</li>
          </ul>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
        <Button className="px-8">
          📄 Export as PDF
        </Button>
        <Button variant="secondary" className="px-8">
          💾 Save Analysis
        </Button>
        <Button variant="secondary" className="px-8">
          🔄 Run Another Analysis
        </Button>
      </div>
    </div>
  )
}