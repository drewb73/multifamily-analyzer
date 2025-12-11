'use client'

import { useState, useEffect } from 'react'
import { Button, Card } from '@/components'
import { PropertyDetailsForm } from './PropertyDetailsForm'
import { UnitMixForm } from './UnitMixForm'
import { IncomeExpenseForm } from './IncomeExpenseForm'
import { AnalysisResults } from './AnalysisResults'
import { AnalysisInputs, AnalysisResults as AnalysisResultsType, UnitType } from '@/types'
import { generateId } from '@/lib/utils'

export function PropertyAnalysisForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<AnalysisInputs>>({
    property: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      purchasePrice: 0,
      downPayment: 0,
      loanTerm: 30,
      interestRate: 6.5,
      propertySize: 0,
      totalUnits: 0,
      isCashPurchase: false,
    },
    unitMix: [],
    expenses: [],
    income: [],
    overallVacancyRate: 5, // Default 5% vacancy
  })
  const [results, setResults] = useState<AnalysisResultsType | null>(null)

  const steps = [
    { id: 1, name: 'Property Details' },
    { id: 2, name: 'Unit Mix' },
    { id: 3, name: 'Income & Expenses' },
    { id: 4, name: 'Results' },
  ]

  // Calculate rental income from unit mix
  const calculateRentalIncome = () => {
    if (!formData.unitMix || formData.unitMix.length === 0) return 0
    
    const totalCurrentRent = formData.unitMix.reduce((sum, unit) => 
      sum + (unit.currentRent * unit.count), 0
    )
    
    // Apply overall vacancy rate
    const vacancyRate = formData.overallVacancyRate || 5
    return totalCurrentRent * (1 - (vacancyRate / 100))
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePropertyUpdate = (property: AnalysisInputs['property']) => {
    setFormData(prev => ({ ...prev, property }))
  }

  const handleUnitMixUpdate = (unitMix: UnitType[]) => {
    setFormData(prev => ({ ...prev, unitMix }))
  }

  const handleVacancyRateChange = (rate: number) => {
    setFormData(prev => ({ ...prev, overallVacancyRate: rate }))
  }

  const handleIncomeExpenseUpdate = (income: AnalysisInputs['income'], expenses: AnalysisInputs['expenses']) => {
    setFormData(prev => ({ ...prev, income, expenses }))
  }

  const handleCalculate = () => {
    // Calculate actual results
    const monthlyRentalIncome = calculateRentalIncome()
    const totalMonthlyIncome = monthlyRentalIncome + 
      (formData.income?.filter(inc => !inc.isCalculated)
        .reduce((sum, inc) => sum + inc.amount, 0) || 0)
    
    // Calculate expenses
    const monthlyExpenses = formData.expenses?.reduce((total, expense) => {
      if (expense.isPercentage) {
        if (expense.percentageOf === 'propertyValue') {
          return total + ((formData.property?.purchasePrice || 0) * (expense.amount / 100) / 12)
        } else {
          return total + (totalMonthlyIncome * (expense.amount / 100))
        }
      }
      return total + expense.amount
    }, 0) || 0

    const netOperatingIncome = totalMonthlyIncome - monthlyExpenses
    
    // Calculate mortgage payment if not cash purchase
    let monthlyMortgagePayment = 0
    if (!formData.property?.isCashPurchase && formData.property) {
      const loanAmount = formData.property.purchasePrice - formData.property.downPayment
      const monthlyRate = (formData.property.interestRate / 100) / 12
      const months = formData.property.loanTerm * 12
      
      if (loanAmount > 0 && monthlyRate > 0 && months > 0) {
        monthlyMortgagePayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / 
          (Math.pow(1 + monthlyRate, months) - 1)
      }
    }

    const monthlyCashFlow = netOperatingIncome - monthlyMortgagePayment
    
    // Calculate key metrics
    const totalInvestment = formData.property?.downPayment || 0
    const annualCashFlow = monthlyCashFlow * 12
    const annualNOI = netOperatingIncome * 12
    const propertyValue = formData.property?.purchasePrice || 1
    const capRate = annualNOI / propertyValue
    const cashOnCashReturn = totalInvestment > 0 ? annualCashFlow / totalInvestment : 0
    const yearsToRecoup = annualCashFlow > 0 ? propertyValue / annualCashFlow : 0

    const calculatedResults: AnalysisResultsType = {
      keyMetrics: {
        capRate,
        cashOnCashReturn,
        netOperatingIncome: annualNOI,
        grossRentMultiplier: propertyValue / (totalMonthlyIncome * 12),
        debtServiceCoverageRatio: formData.property?.isCashPurchase ? Infinity : netOperatingIncome / monthlyMortgagePayment,
        totalInvestment,
        annualCashFlow,
        yearsToRecoup: yearsToRecoup > 0 ? yearsToRecoup : 0,
      },
      monthlyBreakdown: {
        grossIncome: totalMonthlyIncome,
        totalExpenses: monthlyExpenses,
        netOperatingIncome,
        mortgagePayment: monthlyMortgagePayment,
        cashFlow: monthlyCashFlow,
      },
      annualBreakdown: {
        grossIncome: totalMonthlyIncome * 12,
        totalExpenses: monthlyExpenses * 12,
        netOperatingIncome: annualNOI,
        debtService: monthlyMortgagePayment * 12,
        cashFlow: annualCashFlow,
      },
    }

    setResults(calculatedResults)
    setCurrentStep(4)
  }

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-neutral-200">
          <div 
            style={{ width: `${(currentStep / 4) * 100}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-600 transition-all duration-500"
          />
        </div>
        <nav aria-label="Progress">
          <ol className="flex justify-between">
            {steps.map((step) => (
              <li key={step.id} className="relative">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${step.id === currentStep 
                      ? 'bg-primary-600 text-white border-2 border-primary-600' 
                      : step.id < currentStep 
                      ? 'bg-primary-100 text-primary-600 border-2 border-primary-600'
                      : 'bg-white text-neutral-400 border-2 border-neutral-300'
                    }
                  `}>
                    {step.id < currentStep ? '✓' : step.id}
                  </div>
                  <span className={`
                    mt-2 text-sm font-medium
                    ${step.id === currentStep ? 'text-primary-600' : 'text-neutral-500'}
                  `}>
                    {step.name}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Form Content */}
      <Card className="p-6">
        {currentStep === 1 && (
          <PropertyDetailsForm 
            data={formData.property!}
            onUpdate={handlePropertyUpdate}
          />
        )}
        
        {currentStep === 2 && (
          <UnitMixForm 
            data={formData.unitMix ?? []}
            onUpdate={handleUnitMixUpdate}
            totalUnits={formData.property?.totalUnits || 0}
            overallVacancyRate={formData.overallVacancyRate || 5}
            onVacancyRateChange={handleVacancyRateChange}
          />
        )}
        
        {currentStep === 3 && (
          <IncomeExpenseForm 
            incomeData={formData.income ?? []}
            expenseData={formData.expenses ?? []}
            calculatedRentalIncome={calculateRentalIncome()}
            propertyValue={formData.property?.purchasePrice || 0}
            onUpdate={handleIncomeExpenseUpdate}
          />
        )}
        
        {currentStep === 4 && results && (
          <AnalysisResults 
            inputs={formData as AnalysisInputs}
            results={results}
          />
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 && currentStep < 4 && (
            <Button 
              variant="secondary" 
              onClick={handleBack}
              className="px-8"
            >
              Back
            </Button>
          )}
        </div>
        
        <div className="flex gap-4">
          {currentStep < 3 ? (
            <Button 
              onClick={handleNext}
              className="px-8"
            >
              Next
            </Button>
          ) : currentStep === 3 ? (
            <Button 
              onClick={handleCalculate}
              className="px-8"
            >
              Calculate Analysis
            </Button>
          ) : (
            <div className="flex gap-4">
              <Button 
                variant="secondary"
                onClick={() => setCurrentStep(1)}
                className="px-8"
              >
                Start Over
              </Button>
              <Button 
                className="px-8"
                onClick={() => {
                  // TODO: Implement save functionality
                  alert('Analysis saved!')
                }}
              >
                Save Analysis
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}