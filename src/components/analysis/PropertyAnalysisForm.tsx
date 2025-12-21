// src/components/analysis/PropertyAnalysisForm.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Card } from '@/components'
import { PropertyDetailsForm } from './PropertyDetailsForm'
import { UnitMixForm } from './UnitMixForm'
import { IncomeExpenseForm } from './IncomeExpenseForm'
import { AnalysisResults } from './AnalysisResults'
import { SaveAnalysisModal, SaveOptions } from './SaveAnalysisModal'
import { AnalysisInputs, AnalysisResults as AnalysisResultsType, UnitType } from '@/types'
import { useDraftAnalysis } from '@/hooks/useDraftAnalysis'
import { formatTimeAgo } from '@/lib/utils'
import { validatePropertyDetails, validateUnitMix } from '@/lib/utils/validation'
import { saveAnalysisToDatabase, updateAnalysis, getAnalysis } from '@/lib/api/analyses'
import { Save, Check, AlertCircle, Clock } from 'lucide-react'

interface PropertyAnalysisFormProps {
  draftId?: string
  userSubscriptionStatus?: string | null
}

export function PropertyAnalysisForm({ draftId, userSubscriptionStatus = null }: PropertyAnalysisFormProps) {
  // Use draft hook - this is our single source of truth
  const {
    draft,
    saveStatus,
    lastSaved,
    saveDraft,
    autoSaveDraft,
    createNewDraft,
    isSaving,
  } = useDraftAnalysis({ analysisId: draftId })

  // Local state that syncs with draft
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
  })
  const [results, setResults] = useState<AnalysisResultsType | null>(null)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [pendingCalculation, setPendingCalculation] = useState<AnalysisResultsType | null>(null)
  
  // Track if we've loaded the initial draft
  const [hasLoadedInitialDraft, setHasLoadedInitialDraft] = useState(false)

  const steps = [
    { id: 1, name: 'Property Details' },
    { id: 2, name: 'Unit Mix' },
    { id: 3, name: 'Income & Expenses' },
    { id: 4, name: 'Results' },
  ]

  // Load draft data ONCE when component mounts or when draft changes
  useEffect(() => {
    const loadAnalysisData = async () => {
      // If we have a draftId and user is Premium, fetch from database first
      const isPremium = userSubscriptionStatus === 'premium' || userSubscriptionStatus === 'enterprise'
      
      if (draftId && isPremium && !hasLoadedInitialDraft) {
        try {
          console.log('🔍 Fetching analysis from database:', draftId)
          const { analysis } = await getAnalysis(draftId)
          
          if (analysis) {
            console.log('✅ Loaded analysis from database:', analysis.name)
            
            // Load the database analysis into form
            if (analysis.data) {
              setFormData(analysis.data)
            }
            
            if (analysis.results) {
              setResults(analysis.results)
              setCurrentStep(4) // Go to results if we have them
            } else {
              setCurrentStep(1) // Start at beginning if no results
            }
            
            setHasLoadedInitialDraft(true)
            return // Exit early, we loaded from database
          }
        } catch (error) {
          console.error('Failed to load analysis from database:', error)
          // Fall through to localStorage loading
        }
      }
      
      // Fallback to localStorage draft (for non-premium or if database fetch failed)
      if (draft && !hasLoadedInitialDraft) {
        console.log('📥 Loading draft from storage:', { 
          step: draft.step, 
          hasResults: !!draft.results,
          dataPresent: !!draft.data?.property?.address 
        })
        
        // Only update local state if draft has data
        if (draft.data && Object.keys(draft.data).length > 0) {
          setFormData(draft.data)
        }
        
        if (draft.step && draft.step !== currentStep) {
          setCurrentStep(draft.step)
        }
        
        if (draft.results) {
          setResults(draft.results)
        }
        
        setHasLoadedInitialDraft(true)
      }
    }
    
    loadAnalysisData()
  }, [draft, hasLoadedInitialDraft, currentStep, draftId, userSubscriptionStatus])

  // Auto-save when form data changes (with debouncing built into the hook)
  useEffect(() => {
    // Don't auto-save if we're still loading or if form is empty
    if (!hasLoadedInitialDraft || isSaving || !formData?.property?.address) {
      return
    }
    
    autoSaveDraft(formData, currentStep, results)
  }, [formData, currentStep, results, autoSaveDraft, isSaving, hasLoadedInitialDraft])

  // Calculate GROSS rental income from unit mix
  const calculateGrossRentalIncome = useCallback(() => {
    if (!formData.unitMix || formData.unitMix.length === 0) return 0
    return formData.unitMix.reduce((sum, unit) => 
      sum + (unit.currentRent * unit.count), 0
    )
  }, [formData.unitMix])

  const handleNext = async () => {
    // VALIDATION FOR STEP 1 - Property Details
    if (currentStep === 1 && formData.property) {
      const validation = validatePropertyDetails(formData.property)
      if (!validation.isValid) {
        alert(`Please fix the following errors:\n\n${validation.errors.join('\n')}`)
        return
      }
    }

    // VALIDATION FOR STEP 2 - Unit Mix
    if (currentStep === 2) {
      if (!formData.unitMix || formData.unitMix.length === 0) {
        alert('Please add at least one unit type before continuing.')
        return
      }
      
      const validation = validateUnitMix(formData.unitMix, formData.property?.totalUnits || 0)
      if (!validation.isValid) {
        alert(`Please fix the following errors:\n\n${validation.errors.join('\n')}`)
        return
      }
    }

    // If validation passes, move to next step
    if (currentStep < 4) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      await saveDraft(formData, nextStep, results)
    }
  }

  const handleBack = async () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      await saveDraft(formData, prevStep, results)
    }
  }

  const handlePropertyUpdate = useCallback((property: AnalysisInputs['property']) => {
    setFormData(prev => ({ ...prev, property }))
  }, [])

  const handleUnitMixUpdate = useCallback((unitMix: UnitType[]) => {
    setFormData(prev => ({ ...prev, unitMix }))
  }, [])

  const handleIncomeExpenseUpdate = useCallback((income: AnalysisInputs['income'], expenses: AnalysisInputs['expenses']) => {
    setFormData(prev => ({ ...prev, income, expenses }))
  }, [])

  const handleCalculate = async () => {
    // Calculate results
    const monthlyGrossRentalIncome = calculateGrossRentalIncome()
    const otherMonthlyIncome = formData.income?.filter(inc => !inc.isCalculated)
      .reduce((sum, inc) => sum + inc.amount, 0) || 0
    const totalMonthlyGrossIncome = monthlyGrossRentalIncome + otherMonthlyIncome
    
    const monthlyExpenses = formData.expenses?.reduce((total, expense) => {
      if (expense.isPercentage) {
        if (expense.percentageOf === 'propertyValue') {
          return total + ((formData.property?.purchasePrice || 0) * (expense.amount / 100) / 12)
        } else if (expense.percentageOf === 'rent') {
          return total + (monthlyGrossRentalIncome * (expense.amount / 100))
        } else if (expense.percentageOf === 'income') {
          return total + (totalMonthlyGrossIncome * (expense.amount / 100))
        }
      }
      return total + expense.amount
    }, 0) || 0

    const netOperatingIncome = totalMonthlyGrossIncome - monthlyExpenses
    
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
    const propertyValue = formData.property?.purchasePrice || 0
    const totalInvestment = formData.property?.isCashPurchase ? propertyValue : (formData.property?.downPayment || 0)
    const annualCashFlow = monthlyCashFlow * 12
    const annualNOI = netOperatingIncome * 12
    
    const capRate = propertyValue > 0 ? annualNOI / propertyValue : 0
    const cashOnCashReturn = totalInvestment > 0 ? annualCashFlow / totalInvestment : 0
    const grossRentMultiplier = (totalMonthlyGrossIncome * 12) > 0 ? 
      propertyValue / (totalMonthlyGrossIncome * 12) : 0
    const debtServiceCoverageRatio = formData.property?.isCashPurchase || monthlyMortgagePayment === 0 ? 
      Infinity : netOperatingIncome / monthlyMortgagePayment

    const calculatedResults: AnalysisResultsType = {
      keyMetrics: {
        capRate,
        cashOnCashReturn,
        netOperatingIncome: annualNOI,
        grossRentMultiplier,
        debtServiceCoverageRatio,
        totalInvestment,
        annualCashFlow,
      },
      monthlyBreakdown: {
        grossIncome: totalMonthlyGrossIncome,
        totalExpenses: monthlyExpenses,
        netOperatingIncome,
        mortgagePayment: monthlyMortgagePayment,
        cashFlow: monthlyCashFlow,
      },
      annualBreakdown: {
        grossIncome: totalMonthlyGrossIncome * 12,
        totalExpenses: monthlyExpenses * 12,
        netOperatingIncome: annualNOI,
        debtService: monthlyMortgagePayment * 12,
        cashFlow: annualCashFlow,
      },
    }

    console.log('✅ Calculated results, opening save modal')
    
    // Store pending calculation and open modal
    setPendingCalculation(calculatedResults)
    setIsSaveModalOpen(true)
  }

  const handleSaveConfirm = async (saveOptions: SaveOptions) => {
    if (!pendingCalculation) return
    
    try {
      const isPremium = userSubscriptionStatus === 'premium' || userSubscriptionStatus === 'enterprise'
      
      if (isPremium) {
        // Premium user - save to database
        if (saveOptions.overrideExisting && saveOptions.existingAnalysisId) {
          // Update existing analysis
          await updateAnalysis(saveOptions.existingAnalysisId, {
            name: saveOptions.propertyName,
            data: formData as AnalysisInputs,
            results: pendingCalculation,
            groupId: saveOptions.groupId || undefined,
          })
          console.log('✅ Updated existing analysis in database')
        } else {
          // Create new analysis
          await saveAnalysisToDatabase({
            name: saveOptions.propertyName,
            data: formData as AnalysisInputs,
            results: pendingCalculation,
            groupId: saveOptions.groupId || undefined,
          })
          console.log('✅ Saved new analysis to database')
        }
      } else {
        // Trial/Free user - save to localStorage
        await saveDraft(formData, 4, pendingCalculation, saveOptions.propertyName)
        console.log('✅ Saved analysis to localStorage')
      }

      // Update local state and navigate to results
      setResults(pendingCalculation)
      setCurrentStep(4)
      setIsSaveModalOpen(false)
      setPendingCalculation(null)
      
      // Save current state
      await saveDraft(formData, 4, pendingCalculation, saveOptions.propertyName)
      
    } catch (error) {
      console.error('Save error:', error)
      alert('❌ Error saving analysis. Please try again.')
    }
  }

  const handleStartNewAnalysis = () => {
    console.log('🔄 Starting new analysis')
    const newDraft = createNewDraft()
    setFormData(newDraft.data)
    setCurrentStep(1)
    setResults(null)
    setHasLoadedInitialDraft(true) // Mark as loaded since we have a new draft
  }

  const handleSaveAnalysis = async () => {
    try {
      // Determine if user is Premium (can save to database)
      const isPremium = userSubscriptionStatus === 'premium' || userSubscriptionStatus === 'enterprise'
      
      if (isPremium && results) {
        // Premium user - save to database
        try {
          const analysisName = `Analysis ${new Date().toLocaleDateString()}`
          
          const savedAnalysis = await saveAnalysisToDatabase({
            name: analysisName,
            data: formData as AnalysisInputs,
            results: results,
            notes: undefined,
          })
          
          console.log('✅ Saved to database:', savedAnalysis)
          alert('✅ Analysis saved to your account!')
        } catch (dbError: any) {
          console.error('Database save error:', dbError)
          // Fallback to localStorage if database fails
          await saveDraft(formData, currentStep, results, `Saved Analysis ${new Date().toLocaleDateString()}`)
          alert('⚠️ Saved locally (database error). Your analysis is still accessible.')
        }
      } else {
        // Trial/Free user - save to localStorage only
        await saveDraft(formData, currentStep, results, `Saved Analysis ${new Date().toLocaleDateString()}`)
        alert('✅ Analysis saved locally!')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('❌ Error saving analysis. Please try again.')
    }
  }

  // Save status indicator
  const SaveStatusIndicator = () => {
    if (saveStatus === 'saving') {
      return (
        <div className="flex items-center gap-2 text-primary-600">
          <Clock className="w-4 h-4 animate-spin" />
          <span className="text-sm">Saving...</span>
        </div>
      )
    }
    
    if (saveStatus === 'saved' && lastSaved) {
      return (
        <div className="flex items-center gap-2 text-success-600">
          <Check className="w-4 h-4" />
          <span className="text-sm">Saved {formatTimeAgo(lastSaved)}</span>
        </div>
      )
    }
    
    if (saveStatus === 'error') {
      return (
        <div className="flex items-center gap-2 text-error-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Save failed</span>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-2 text-warning-600">
        <Save className="w-4 h-4" />
        <span className="text-sm">Unsaved changes</span>
      </div>
    )
  }

  // Show loading state while initial draft loads
  if (!hasLoadedInitialDraft && !draftId) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-neutral-600">Preparing analysis tool...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Save Analysis Modal */}
      <SaveAnalysisModal
        isOpen={isSaveModalOpen}
        onClose={() => {
          setIsSaveModalOpen(false)
          setPendingCalculation(null)
        }}
        onConfirm={handleSaveConfirm}
        propertyAddress={formData.property?.address || ''}
        isPremium={userSubscriptionStatus === 'premium' || userSubscriptionStatus === 'enterprise'}
      />

      {/* Header with Save Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Property Analysis
          </h1>
          {draft?.name && (
            <p className="text-neutral-600 mt-1">{draft.name}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <SaveStatusIndicator />
          <button
            onClick={handleSaveAnalysis}
            disabled={isSaving}
            className={`btn-secondary text-sm px-4 py-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : '💾 Save Now'}
          </button>
        </div>
      </div>

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
            calculatedRentalIncome={calculateGrossRentalIncome()}
            propertyValue={formData.property?.purchasePrice || 0}
            onUpdate={handleIncomeExpenseUpdate}
          />
        )}
        
        {currentStep === 4 && results && (
          <AnalysisResults 
            inputs={formData as AnalysisInputs}
            results={results}
            onBackToEdit={() => setCurrentStep(3)}
            userSubscriptionStatus={userSubscriptionStatus}
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
              disabled={isSaving}
              className="px-8"
            >
              ← Back
            </Button>
          )}
        </div>
        
        <div>
          {currentStep < 3 ? (
            <Button 
              onClick={handleNext}
              disabled={isSaving}
              className="px-8"
            >
              Next →
            </Button>
          ) : currentStep === 3 ? (
            <Button 
              onClick={handleCalculate}
              disabled={isSaving}
              className="px-8"
            >
              {isSaving ? 'Calculating...' : 'Calculate Analysis'}
            </Button>
          ) : (
            <div className="flex gap-4">
              <Button 
                variant="secondary"
                onClick={handleStartNewAnalysis}
                disabled={isSaving}
                className="px-8"
              >
                Start New Analysis
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}