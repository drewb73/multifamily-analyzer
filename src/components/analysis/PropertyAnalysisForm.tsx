'use client'

import { useState } from 'react'
import { Button, Card } from '@/components'
import { PropertyDetailsForm } from './PropertyDetailsForm'
import { UnitMixForm } from './UnitMixForm'
import { IncomeExpenseForm } from './IncomeExpenseForm'
import { AnalysisResults } from './AnalysisResults'
import { AnalysisInputs, AnalysisResults as AnalysisResultsType } from '@/types'

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
    },
    unitMix: [],
    expenses: [],
    income: [],
  })
  const [results, setResults] = useState<AnalysisResultsType | null>(null)

  const steps = [
    { id: 1, name: 'Property Details' },
    { id: 2, name: 'Unit Mix' },
    { id: 3, name: 'Income & Expenses' },
    { id: 4, name: 'Results' },
  ]

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

  const handleUnitMixUpdate = (unitMix: AnalysisInputs['unitMix']) => {
    setFormData(prev => ({ ...prev, unitMix }))
  }

  const handleIncomeExpenseUpdate = (income: AnalysisInputs['income'], expenses: AnalysisInputs['expenses']) => {
    setFormData(prev => ({ ...prev, income, expenses }))
  }

  const handleCalculate = () => {
    // Calculate results (we'll implement this later)
    const mockResults: AnalysisResultsType = {
      keyMetrics: {
        capRate: 0.065,
        cashOnCashReturn: 0.082,
        netOperatingIncome: 120000,
        grossRentMultiplier: 12.5,
        debtServiceCoverageRatio: 1.25,
        totalInvestment: 1000000,
        annualCashFlow: 32000,
        yearsToRecoup: 12.5,
      },
      monthlyBreakdown: {
        grossIncome: 20000,
        totalExpenses: 8000,
        netOperatingIncome: 10000,
        mortgagePayment: 6000,
        cashFlow: 2667,
      },
      annualBreakdown: {
        grossIncome: 240000,
        totalExpenses: 96000,
        netOperatingIncome: 120000,
        debtService: 72000,
        cashFlow: 32000,
      },
    }
    setResults(mockResults)
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
          />
        )}
        
        {currentStep === 3 && (
          <IncomeExpenseForm 
            incomeData={formData.income ?? []}
            expenseData={formData.expenses ?? []}
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