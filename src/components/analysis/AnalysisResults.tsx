'use client'

import { useState } from 'react'
import { AnalysisInputs, AnalysisResults as AnalysisResultsType } from '@/types'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { Card, Button } from '@/components'

interface AnalysisResultsProps {
  inputs: AnalysisInputs
  results: AnalysisResultsType
  onBackToEdit?: () => void  // Add this prop
}

export function AnalysisResults({ inputs, results, onBackToEdit }: AnalysisResultsProps) {
  const [showMarketAnalysis, setShowMarketAnalysis] = useState(false)
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

  // Calculate MARKET RENT scenario
  const calculateMarketRentMetrics = () => {
    // 1. Calculate GROSS market rental income
    const monthlyGrossMarketRentalIncome = inputs.unitMix.reduce((sum, unit) => 
      sum + (unit.marketRent * unit.count), 0
    )
    
    // 2. Calculate other income (parking, laundry, etc.)
    const otherMonthlyIncome = inputs.income?.filter(inc => !inc.isCalculated)
      .reduce((sum, inc) => sum + inc.amount, 0) || 0
    
    // 3. Total GROSS monthly market income
    const totalMonthlyGrossMarketIncome = monthlyGrossMarketRentalIncome + otherMonthlyIncome
    
    // 4. Calculate expenses (same percentages, but based on market rent)
    const monthlyMarketExpenses = inputs.expenses.reduce((total, expense) => {
      if (expense.isPercentage) {
        if (expense.percentageOf === 'propertyValue') {
          return total + ((inputs.property.purchasePrice || 0) * (expense.amount / 100) / 12)
        } else if (expense.percentageOf === 'rent') {
          // Based on MARKET rental income
          return total + (monthlyGrossMarketRentalIncome * (expense.amount / 100))
        } else if (expense.percentageOf === 'income') {
          // Based on total gross market income
          return total + (totalMonthlyGrossMarketIncome * (expense.amount / 100))
        }
      }
      return total + expense.amount
    }, 0)

    // 5. Calculate Market NOI
    const marketNetOperatingIncome = totalMonthlyGrossMarketIncome - monthlyMarketExpenses
    
    // 6. Same mortgage payment (doesn't change with rent)
    const monthlyMortgagePayment = results.monthlyBreakdown.mortgagePayment
    
    // 7. Calculate monthly market cash flow
    const monthlyMarketCashFlow = marketNetOperatingIncome - monthlyMortgagePayment
    
    // 8. Calculate key metrics for market scenario
    const propertyValue = inputs.property.purchasePrice || 0
    const annualMarketCashFlow = monthlyMarketCashFlow * 12
    const annualMarketNOI = marketNetOperatingIncome * 12
    
    const marketCapRate = propertyValue > 0 ? annualMarketNOI / propertyValue : 0
    const marketCashOnCash = results.keyMetrics.totalInvestment > 0 ? 
      annualMarketCashFlow / results.keyMetrics.totalInvestment : 0
    
    const marketGrossRentMultiplier = (totalMonthlyGrossMarketIncome * 12) > 0 ? 
      propertyValue / (totalMonthlyGrossMarketIncome * 12) : 0

    return {
      keyMetrics: {
        capRate: marketCapRate,
        cashOnCashReturn: marketCashOnCash,
        netOperatingIncome: annualMarketNOI,
        grossRentMultiplier: marketGrossRentMultiplier,
        debtServiceCoverageRatio: isCashPurchase || monthlyMortgagePayment === 0 ? 
          Infinity : marketNetOperatingIncome / monthlyMortgagePayment,
        totalInvestment: results.keyMetrics.totalInvestment,
        annualCashFlow: annualMarketCashFlow,
      },
      monthlyBreakdown: {
        grossIncome: totalMonthlyGrossMarketIncome,
        totalExpenses: monthlyMarketExpenses,
        netOperatingIncome: marketNetOperatingIncome,
        mortgagePayment: monthlyMortgagePayment,
        cashFlow: monthlyMarketCashFlow,
      },
      annualBreakdown: {
        grossIncome: totalMonthlyGrossMarketIncome * 12,
        totalExpenses: monthlyMarketExpenses * 12,
        netOperatingIncome: annualMarketNOI,
        debtService: monthlyMortgagePayment * 12,
        cashFlow: annualMarketCashFlow,
      }
    }
  }

  const marketResults = calculateMarketRentMetrics()

  // Calculate upside potential
  const upsidePotential = {
    monthlyCashFlow: marketResults.monthlyBreakdown.cashFlow - results.monthlyBreakdown.cashFlow,
    annualCashFlow: marketResults.keyMetrics.annualCashFlow - results.keyMetrics.annualCashFlow,
    monthlyNOI: marketResults.monthlyBreakdown.netOperatingIncome - results.monthlyBreakdown.netOperatingIncome,
    annualNOI: marketResults.keyMetrics.netOperatingIncome - results.keyMetrics.netOperatingIncome,
    capRate: marketResults.keyMetrics.capRate - results.keyMetrics.capRate,
    cashOnCash: marketResults.keyMetrics.cashOnCashReturn - results.keyMetrics.cashOnCashReturn,
    monthlyGrossIncome: marketResults.monthlyBreakdown.grossIncome - results.monthlyBreakdown.grossIncome,
    annualGrossIncome: marketResults.annualBreakdown.grossIncome - results.annualBreakdown.grossIncome,
  }

  // Use either current or market results based on toggle
  const displayResults = showMarketAnalysis ? marketResults : results

  // Calculation explanations
  const calculations = {
    capRate: {
      formula: "Annual NOI ÷ Purchase Price",
      example: `${formatCurrency(displayResults.annualBreakdown.netOperatingIncome)} ÷ ${formatCurrency(inputs.property.purchasePrice)}`,
      result: formatPercentage(displayResults.keyMetrics.capRate),
      description: "The property's unleveraged return based on its current market value. Measures property performance regardless of financing."
    },
    cashOnCash: {
      formula: "Annual Cash Flow ÷ Down Payment",
      example: `${formatCurrency(displayResults.keyMetrics.annualCashFlow)} ÷ ${formatCurrency(displayResults.keyMetrics.totalInvestment)}`,
      result: formatPercentage(displayResults.keyMetrics.cashOnCashReturn),
      description: "Your actual return on cash invested. Includes the effect of financing (leverage). Higher leverage typically increases this return."
    },
    grossRentMultiplier: {
      formula: "Purchase Price ÷ Annual Gross Rent",
      example: `${formatCurrency(inputs.property.purchasePrice)} ÷ ${formatCurrency(displayResults.annualBreakdown.grossIncome)}`,
      result: `${displayResults.keyMetrics.grossRentMultiplier.toFixed(1)}`,
      description: "How many years of gross rent it would take to pay for the property. Lower numbers indicate better value. Typical range: 8-12 for most markets."
    },
    noi: {
      formula: "Gross Income - Total Expenses",
      example: `${formatCurrency(displayResults.annualBreakdown.grossIncome)} - ${formatCurrency(displayResults.annualBreakdown.totalExpenses)}`,
      result: formatCurrency(displayResults.keyMetrics.netOperatingIncome),
      description: "Net Operating Income - the property's profit before financing costs. This is what the property earns on its own."
    }
  }

  return (
    <div className="space-y-8" id="analysis-results">
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold text-neutral-900 mb-4">
          Analysis Results
        </h2>
        <p className="text-lg text-neutral-600 mb-6">
          Your property analysis is complete! Here are the key metrics.
        </p>
        {isCashPurchase && (
          <div className="inline-block mb-6 px-4 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
            All Cash Purchase
          </div>
        )}
        
        {/* Analysis Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-neutral-200 p-1 bg-white">
            <button
              onClick={() => setShowMarketAnalysis(false)}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                !showMarketAnalysis 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Current Rent Analysis
            </button>
            <button
              onClick={() => setShowMarketAnalysis(true)}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                showMarketAnalysis 
                  ? 'bg-secondary-600 text-white shadow-sm' 
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Market Rent Analysis
            </button>
          </div>
        </div>

        {/* Analysis Mode Indicator */}
        <div className={`inline-block px-6 py-2 rounded-lg mb-6 ${showMarketAnalysis ? 'bg-secondary-100 text-secondary-700' : 'bg-primary-100 text-primary-700'}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {showMarketAnalysis ? '📈' : '📊'}
            </span>
            <span className="font-medium">
              {showMarketAnalysis ? 'Showing Market Rent Analysis' : 'Showing Current Rent Analysis'}
            </span>
          </div>
        </div>

        {/* Upside Potential Banner */}
        {showMarketAnalysis && (
          <div className="max-w-2xl mx-auto mb-8">
            <Card className="p-4 bg-gradient-to-r from-accent-50 to-secondary-50 border-accent-200">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">💎 Upside Potential</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xl font-bold text-success-600">
                      {formatCurrency(upsidePotential.annualCashFlow)}
                    </div>
                    <div className="text-sm text-neutral-600">Annual Cash Flow Increase</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-success-600">
                      {formatPercentage(upsidePotential.capRate)}
                    </div>
                    <div className="text-sm text-neutral-600">CAP Rate Increase</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-success-600">
                      {formatCurrency(upsidePotential.annualGrossIncome)}
                    </div>
                    <div className="text-sm text-neutral-600">Annual Gross Income Increase</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {formatPercentage(displayResults.keyMetrics.capRate)}
          </div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">CAP Rate</div>
          <div className="text-sm text-neutral-600">Property's unleveraged return</div>
          {showMarketAnalysis && upsidePotential.capRate > 0 && (
            <div className="text-xs text-success-600 font-medium mt-1">
              ↑ {formatPercentage(upsidePotential.capRate)}
            </div>
          )}
        </Card>
        
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-secondary-600 mb-2">
            {formatPercentage(displayResults.keyMetrics.cashOnCashReturn)}
          </div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">Cash on Cash</div>
          <div className="text-sm text-neutral-600">Return on cash invested</div>
          {showMarketAnalysis && upsidePotential.cashOnCash > 0 && (
            <div className="text-xs text-success-600 font-medium mt-1">
              ↑ {formatPercentage(upsidePotential.cashOnCash)}
            </div>
          )}
        </Card>
        
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-accent-600 mb-2">
            {formatCurrency(displayResults.keyMetrics.annualCashFlow)}
          </div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">Annual Cash Flow</div>
          <div className="text-sm text-neutral-600">Yearly profit after expenses</div>
          {showMarketAnalysis && upsidePotential.annualCashFlow > 0 && (
            <div className="text-xs text-success-600 font-medium mt-1">
              ↑ {formatCurrency(upsidePotential.annualCashFlow)}
            </div>
          )}
        </Card>
        
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-neutral-600 mb-2">
            {displayResults.keyMetrics.grossRentMultiplier.toFixed(1)}
          </div>
          <div className="text-lg font-semibold text-neutral-800 mb-2">Gross Rent Multiplier</div>
          <div className="text-sm text-neutral-600">Price ÷ Annual Gross Rent</div>
          {showMarketAnalysis && (
            <div className="text-xs text-neutral-500 font-medium mt-1">
              Market: {marketResults.keyMetrics.grossRentMultiplier.toFixed(1)}
            </div>
          )}
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
              
              <div className="text-sm text-neutral-600">Analysis Mode:</div>
              <div className={`text-sm font-medium ${showMarketAnalysis ? 'text-secondary-600' : 'text-primary-600'}`}>
                {showMarketAnalysis ? 'Market Rent' : 'Current Rent'}
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
              <span className="font-medium">{formatCurrency(displayResults.monthlyBreakdown.grossIncome)}</span>
              {showMarketAnalysis && (
                <span className="text-xs text-success-600 font-medium ml-2">
                  ↑ {formatCurrency(upsidePotential.monthlyGrossIncome)}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Total Expenses:</span>
              <span className="font-medium text-error-600">-{formatCurrency(displayResults.monthlyBreakdown.totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Net Operating Income:</span>
              <span className="font-medium">{formatCurrency(displayResults.monthlyBreakdown.netOperatingIncome)}</span>
              {showMarketAnalysis && (
                <span className="text-xs text-success-600 font-medium ml-2">
                  ↑ {formatCurrency(upsidePotential.monthlyNOI)}
                </span>
              )}
            </div>
            {!isCashPurchase && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Mortgage Payment:</span>
                <span className="font-medium text-error-600">-{formatCurrency(displayResults.monthlyBreakdown.mortgagePayment)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-neutral-200">
              <span className="text-lg font-semibold text-neutral-800">Monthly Cash Flow:</span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${displayResults.monthlyBreakdown.cashFlow >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                  {formatCurrency(displayResults.monthlyBreakdown.cashFlow)}
                </span>
                {showMarketAnalysis && (
                  <span className="text-xs text-success-600 font-medium">
                    ↑ {formatCurrency(upsidePotential.monthlyCashFlow)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-neutral-800 mb-4">Annual Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Gross Income:</span>
              <span className="font-medium">{formatCurrency(displayResults.annualBreakdown.grossIncome)}</span>
              {showMarketAnalysis && (
                <span className="text-xs text-success-600 font-medium ml-2">
                  ↑ {formatCurrency(upsidePotential.annualGrossIncome)}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Total Expenses:</span>
              <span className="font-medium text-error-600">-{formatCurrency(displayResults.annualBreakdown.totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Net Operating Income:</span>
              <span className="font-medium">{formatCurrency(displayResults.annualBreakdown.netOperatingIncome)}</span>
              {showMarketAnalysis && (
                <span className="text-xs text-success-600 font-medium ml-2">
                  ↑ {formatCurrency(upsidePotential.annualNOI)}
                </span>
              )}
            </div>
            {!isCashPurchase && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Debt Service:</span>
                <span className="font-medium text-error-600">-{formatCurrency(displayResults.annualBreakdown.debtService)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-neutral-200">
              <span className="text-lg font-semibold text-neutral-800">Annual Cash Flow:</span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${displayResults.annualBreakdown.cashFlow >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                  {formatCurrency(displayResults.annualBreakdown.cashFlow)}
                </span>
                {showMarketAnalysis && (
                  <span className="text-xs text-success-600 font-medium">
                    ↑ {formatCurrency(upsidePotential.annualCashFlow)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Rent Comparison */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-neutral-800 mb-4">Rent Comparison</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Unit Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Count</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Current Rent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Market Rent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Difference</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Monthly Impact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Annual Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {inputs.unitMix.map((unit) => {
                const rentDifference = unit.marketRent - unit.currentRent
                const monthlyImpact = rentDifference * unit.count
                const annualImpact = monthlyImpact * 12
                
                return (
                  <tr key={unit.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {unit.type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">
                      {unit.count}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {formatCurrency(unit.currentRent)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-secondary-600">
                      {formatCurrency(unit.marketRent)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`font-medium ${rentDifference > 0 ? 'text-success-600' : 'text-error-600'}`}>
                        {rentDifference > 0 ? '+' : ''}{formatCurrency(rentDifference)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`font-medium ${monthlyImpact > 0 ? 'text-success-600' : 'text-error-600'}`}>
                        {monthlyImpact > 0 ? '+' : ''}{formatCurrency(monthlyImpact)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`font-medium ${annualImpact > 0 ? 'text-success-600' : 'text-error-600'}`}>
                        {annualImpact > 0 ? '+' : ''}{formatCurrency(annualImpact)}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {/* Totals Row */}
              <tr className="bg-neutral-50 font-semibold">
                <td colSpan={2} className="px-4 py-3 text-right">Totals:</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatCurrency(inputs.unitMix.reduce((sum, unit) => sum + (unit.currentRent * unit.count), 0))}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-secondary-600">
                  {formatCurrency(inputs.unitMix.reduce((sum, unit) => sum + (unit.marketRent * unit.count), 0))}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-success-600">
                    +{formatCurrency(inputs.unitMix.reduce((sum, unit) => sum + ((unit.marketRent - unit.currentRent) * unit.count), 0))}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-success-600">
                  +{formatCurrency(inputs.unitMix.reduce((sum, unit) => sum + ((unit.marketRent - unit.currentRent) * unit.count), 0))}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-success-600">
                  +{formatCurrency(inputs.unitMix.reduce((sum, unit) => sum + ((unit.marketRent - unit.currentRent) * unit.count * 12), 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Calculation Breakdown */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-neutral-800 mb-4">How These Numbers Are Calculated</h3>
        <div className="space-y-6">
          {/* CAP Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-primary-700">CAP Rate</h4>
              <span className="text-lg font-bold text-primary-600">{formatPercentage(displayResults.keyMetrics.capRate)}</span>
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
              <span className="text-lg font-bold text-secondary-600">{formatPercentage(displayResults.keyMetrics.cashOnCashReturn)}</span>
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
              <span className="text-lg font-bold text-accent-600">{formatCurrency(displayResults.keyMetrics.netOperatingIncome)}</span>
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
            {showMarketAnalysis && (
              <li className="text-success-700 font-medium">• Switching to market rents increases annual cash flow by {formatCurrency(upsidePotential.annualCashFlow)}</li>
            )}
          </ul>
        </div>
      </Card>

      {/* Action Buttons - UPDATED with Back Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-8">
        <div>
          {onBackToEdit && (
            <Button 
              variant="secondary" 
              onClick={onBackToEdit}
              className="px-8"
            >
              ← Back to Edit
            </Button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
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
    </div>
  )
}