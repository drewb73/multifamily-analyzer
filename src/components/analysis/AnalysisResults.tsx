'use client'

import { AnalysisInputs, AnalysisResults as AnalysisResultsType } from '@/types'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { Card, Button } from '@/components'

interface AnalysisResultsProps {
  inputs: AnalysisInputs
  results: AnalysisResultsType
}

export function AnalysisResults({ inputs, results }: AnalysisResultsProps) {
  // We'll implement the actual results display in the next step
  // For now, let's create a basic structure
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold text-neutral-900 mb-4">
          Analysis Results
        </h2>
        <p className="text-lg text-neutral-600">
          Your property analysis is complete! Here are the key metrics.
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {formatPercentage(results.keyMetrics.capRate)}
          </div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">CAP Rate</div>
          <div className="text-sm text-neutral-600">Annual return on property value</div>
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
            {results.keyMetrics.yearsToRecoup.toFixed(1)}
          </div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">Years to Recoup</div>
          <div className="text-sm text-neutral-600">Time to recover investment</div>
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
              
              <div className="text-sm text-neutral-600">Down Payment:</div>
              <div className="text-sm font-medium">{formatCurrency(inputs.property.downPayment)}</div>
              
              <div className="text-sm text-neutral-600">Loan Amount:</div>
              <div className="text-sm font-medium">
                {formatCurrency(inputs.property.purchasePrice - inputs.property.downPayment)}
              </div>
              
              <div className="text-sm text-neutral-600">Interest Rate:</div>
              <div className="text-sm font-medium">{inputs.property.interestRate}%</div>
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
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Mortgage Payment:</span>
              <span className="font-medium text-error-600">-{formatCurrency(results.monthlyBreakdown.mortgagePayment)}</span>
            </div>
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
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Debt Service:</span>
              <span className="font-medium text-error-600">-{formatCurrency(results.annualBreakdown.debtService)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-neutral-200">
              <span className="text-lg font-semibold text-neutral-800">Annual Cash Flow:</span>
              <span className={`text-lg font-bold ${results.annualBreakdown.cashFlow >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {formatCurrency(results.annualBreakdown.cashFlow)}
              </span>
            </div>
          </div>
        </Card>
      </div>

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