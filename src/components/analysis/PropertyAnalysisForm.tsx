// FILE LOCATION: /src/components/analysis/PropertyAnalysisForm.tsx
// IMPROVED: Better deal creation with duplicate prevention and logging

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card } from '@/components'
import { RotateCcw } from 'lucide-react'
import { PropertyDetailsForm } from './PropertyDetailsForm'
import { UnitMixForm } from './UnitMixForm'
import { IncomeExpenseForm } from './IncomeExpenseForm'
import { AnalysisResults } from './AnalysisResults'
import { SaveAnalysisModal, SaveOptions } from './SaveAnalysisModal'
import { ValidationError } from './ValidationError'
import { AnalysisInputs, AnalysisResults as AnalysisResultsType, UnitType } from '@/types'
import { useDraftAnalysis } from '@/hooks/useDraftAnalysis'
import { validatePropertyDetails, validateUnitMix } from '@/lib/utils/validation'
import { saveAnalysisToDatabase, updateAnalysis, getAnalysis } from '@/lib/api/analyses'
import { SuccessToast } from '@/components/ui/SuccessToast'

interface PropertyAnalysisFormProps {
  draftId?: string
  userSubscriptionStatus?: string | null
  initialDealData?: {  // ✅ NEW: For creating analysis from deal
    dealId: string
    address: string
    city: string | null
    state: string | null
    zipCode: string | null
    purchasePrice: number
    downPayment: number | null
    loanTerm: number | null
    loanRate: number | null
    propertySize: number | null
    totalUnits: number | null
    isCashPurchase: boolean
  } | null
}

export function PropertyAnalysisForm({ 
  draftId, 
  userSubscriptionStatus = null,
  initialDealData = null  // ✅ NEW
}: PropertyAnalysisFormProps) {
  // ✅ CHECK FOR CLEAR FLAG IMMEDIATELY (before any hooks run)
  const shouldClearForm = typeof window !== 'undefined' && sessionStorage.getItem('clearAnalysisForm') === 'true'
  
  if (shouldClearForm) {
    console.log('🧹 Form will be cleared on mount')
    sessionStorage.removeItem('clearAnalysisForm')
  }
  
  // ✅ DEBUG: Log what we receive IMMEDIATELY
  console.log('🎯 PropertyAnalysisForm MOUNTED with initialDealData:', initialDealData)
  console.log('  Is it null?', initialDealData === null)
  console.log('  Is it undefined?', initialDealData === undefined)
  console.log('  Type:', typeof initialDealData)
  
  // ✅ Router for navigation
  const router = useRouter()
  
  // Use draft hook - this is our single source of truth
  const {
    draft,
    saveStatus,
    lastSaved,
    saveDraft,
    autoSaveDraft,
    createNewDraft,
    clearCurrentDraft,  // ✅ NEW: Need this to clear draft
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
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  
  // Validation error state - NEW
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showValidationError, setShowValidationError] = useState(false)
  
  // Success toast state - NEW
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' })
  
  // Track if we've loaded the initial draft
  const [hasLoadedInitialDraft, setHasLoadedInitialDraft] = useState(false)
  
  // ✅ NEW: Reset form if flag was set
  useEffect(() => {
    if (shouldClearForm) {
      console.log('🧹 Resetting analysis form to empty state')
      
      // Clear the draft
      if (clearCurrentDraft) {
        clearCurrentDraft()
      }
      
      // Reset form to empty state
      setFormData({
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
      setCurrentStep(1)
      setResults(null)
      setHasLoadedInitialDraft(true) // Prevent draft from loading later
    }
  }, [shouldClearForm]) // Run when flag changes
  
  // ✅ NEW: Separate useEffect JUST for initialDealData that always runs
  useEffect(() => {
    if (initialDealData) {
      console.log('🚀 DEDICATED useEffect for initialDealData triggered!')
      console.log('  hasLoadedInitialDraft:', hasLoadedInitialDraft)
      console.log('  initialDealData:', initialDealData)
      
      if (!hasLoadedInitialDraft) {
        console.log('📊 PRE-POPULATING form from deal NOW!')
        
        const newFormData = {
          property: {
            address: initialDealData.address,
            city: initialDealData.city || '',
            state: initialDealData.state || '',
            zipCode: initialDealData.zipCode || '',
            purchasePrice: initialDealData.purchasePrice,
            downPayment: initialDealData.downPayment || 0,
            loanTerm: initialDealData.loanTerm || 30,
            interestRate: initialDealData.loanRate || 6.5,
            propertySize: initialDealData.propertySize || 0,
            totalUnits: initialDealData.totalUnits || 0,
            isCashPurchase: initialDealData.isCashPurchase,
          },
          unitMix: [],
          expenses: [],
          income: [],
        }
        
        console.log('🔍 Setting formData to:', {
          address: newFormData.property.address,
          city: newFormData.property.city,
          state: newFormData.property.state,
          purchasePrice: newFormData.property.purchasePrice,
          downPayment: newFormData.property.downPayment,
          totalUnits: newFormData.property.totalUnits
        })
        
        setFormData(newFormData)
        setCurrentStep(1)
        setHasLoadedInitialDraft(true)
        console.log('✅ PRE-POPULATION COMPLETE!')
      } else {
        console.log('⚠️ Skipped pre-population - hasLoadedInitialDraft is already true')
      }
    } else {
      console.log('❌ initialDealData is null/undefined')
    }
  }, [initialDealData]) // Only re-run if initialDealData changes

  const steps = [
    { id: 1, name: 'Property Details' },
    { id: 2, name: 'Unit Mix' },
    { id: 3, name: 'Income & Expenses' },
    { id: 4, name: 'Results' },
  ]

  // Load draft data ONCE when component mounts or when draft changes
  useEffect(() => {
    const loadAnalysisData = async () => {
      // ✅ NEW: Skip ALL loading if form should be cleared
      if (shouldClearForm) {
        console.log('⏭️ Skipping ALL data loading - form is being cleared')
        return
      }
      
      // ✅ REMOVED: Pre-population now handled by dedicated useEffect above
      // This prevents conflicts and makes the flow clearer
      
      // If we have a draftId and user is Premium, fetch from database first
      const isPremium = userSubscriptionStatus === 'premium' || userSubscriptionStatus === 'enterprise'
      
      // ✅ IMPORTANT: Skip draft loading if we have initialDealData
      if (initialDealData) {
        console.log('⏭️ Skipping draft/database load - using initialDealData instead')
        return
      }
      
      if (draftId && isPremium && !hasLoadedInitialDraft) {
        setIsLoadingAnalysis(true) // Show loading screen
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
            setIsLoadingAnalysis(false) // Hide loading screen
            return // Exit early, we loaded from database
          }
        } catch (error) {
          console.error('Failed to load analysis from database:', error)
          setIsLoadingAnalysis(false) // Hide loading screen on error
          // Fall through to localStorage loading
        }
      }
      
      // ✅ FIX: Only load from localStorage draft if we have a draftId in URL
      // This prevents "ghost" drafts from appearing when user wants a fresh form
      if (draft && !hasLoadedInitialDraft && draftId) {
        console.log('📥 Loading draft from storage (draftId provided):', { 
          draftId,
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
      } else if (!draftId && !hasLoadedInitialDraft && !initialDealData) {
        // ✅ NEW: No draftId = user wants fresh form
        console.log('✨ No draftId provided - starting with fresh form')
        setHasLoadedInitialDraft(true)
      }
    }
    
    loadAnalysisData()
  }, [draft, hasLoadedInitialDraft, currentStep, draftId, userSubscriptionStatus, initialDealData])

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
        // CHANGED: Use custom modal instead of alert
        setValidationErrors(validation.errors)
        setShowValidationError(true)
        return
      }
    }

    // VALIDATION FOR STEP 2 - Unit Mix
    if (currentStep === 2) {
      if (!formData.unitMix || formData.unitMix.length === 0) {
        // CHANGED: Use custom modal instead of alert
        setValidationErrors(['Please add at least one unit type before continuing.'])
        setShowValidationError(true)
        return
      }
      
      const validation = validateUnitMix(formData.unitMix, formData.property?.totalUnits || 0)
      if (!validation.isValid) {
        // CHANGED: Use custom modal instead of alert
        setValidationErrors(validation.errors)
        setShowValidationError(true)
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

  // ========================================
  // ✨ IMPROVED: Updated handleSaveConfirm with duplicate prevention
  // ========================================
  const handleSaveConfirm = async (saveOptions: SaveOptions) => {
    if (!pendingCalculation) return
    
    try {
      const isPremium = userSubscriptionStatus === 'premium' || userSubscriptionStatus === 'enterprise'
      let savedAnalysisId = saveOptions.existingAnalysisId // Track analysis ID for deal creation
      
      if (isPremium) {
        // Premium user - save to database
        if (saveOptions.overrideExisting && saveOptions.existingAnalysisId) {
          // Update existing analysis
          await updateAnalysis(saveOptions.existingAnalysisId, {
            name: saveOptions.propertyName,
            data: formData as AnalysisInputs,
            results: pendingCalculation,
            groupId: saveOptions.groupId,
          })
          console.log('✅ Updated existing analysis in database')
        } else {
          // Create new analysis and capture the ID
          const savedAnalysis = await saveAnalysisToDatabase({
            name: saveOptions.propertyName,
            data: formData as AnalysisInputs,
            results: pendingCalculation,
            groupId: saveOptions.groupId,
          })
          savedAnalysisId = savedAnalysis.analysis?.id // ✨ Capture the analysis ID
          console.log('✅ Saved new analysis to database, ID:', savedAnalysisId)
        }
        
        // ========================================
        // ✨ IMPROVED: LINK TO EXISTING DEAL OR CREATE NEW ONE
        // ========================================
        // PRIORITY 1: If we have linkedDealId, link to that deal (don't create new)
        if (saveOptions.linkedDealId && savedAnalysisId) {
          try {
            console.log('🔗 Linking analysis to existing deal:', saveOptions.linkedDealId)
            
            const linkResponse = await fetch(`/api/dealiq/${saveOptions.linkedDealId}/update-analysis`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ analysisId: savedAnalysisId })
            })
            
            if (linkResponse.ok) {
              console.log('✅ Analysis linked to deal!')
              setSuccessMessage({
                title: 'Analysis Saved!',
                message: `Successfully linked to Deal #${saveOptions.linkedDealId}`
              })
              setShowSuccessToast(true)
              setTimeout(() => {
                window.location.href = `/dashboard/dealiq/${saveOptions.linkedDealId}`
              }, 1000)
              return // Exit - redirect will happen
            } else {
              const errorData = await linkResponse.json()
              console.error('Failed to link analysis:', errorData)
              setSuccessMessage({
                title: 'Analysis Saved',
                message: 'Warning: Failed to link to deal. You can link it manually.'
              })
              setShowSuccessToast(true)
            }
          } catch (error) {
            console.error('Error linking analysis to deal:', error)
            setSuccessMessage({
              title: 'Analysis Saved',
              message: 'Warning: Failed to link to deal. You can link it manually.'
            })
            setShowSuccessToast(true)
          }
        }
        // PRIORITY 2: If user checked "Create Deal" and no linkedDealId, create new deal
        else if (saveOptions.createDeal && savedAnalysisId) {
          try {
            console.log('🎯 Creating deal in DealIQ for analysis:', savedAnalysisId)
            
            // Check if deal already exists for this analysis
            const checkResponse = await fetch('/api/dealiq')
            const existingDealsData = await checkResponse.json()
            
            if (existingDealsData.success && existingDealsData.deals) {
              const existingDeal = existingDealsData.deals.find((d: any) => d.analysisId === savedAnalysisId)
              
              if (existingDeal) {
                console.log('ℹ️ Deal already exists for this analysis:', existingDeal.dealId)
                console.log('📍 Existing deal MongoDB ID:', existingDeal.id)
                console.log('📍 Existing deal ID (7-digit):', existingDeal.dealId)
                setSuccessMessage({
                  title: 'Analysis Saved!',
                  message: `Deal #${existingDeal.dealId} is already linked to this analysis.`
                })
                setShowSuccessToast(true)
              } else {
                // No existing deal - create new one
                console.log('✨ No existing deal found, creating new one...')
                
                const dealResponse = await fetch('/api/dealiq', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    analysisId: savedAnalysisId,
                    address: formData.property?.address || 'Unknown Address',
                    city: formData.property?.city || null,
                    state: formData.property?.state || null,
                    zipCode: formData.property?.zipCode || null,
                    price: formData.property?.purchasePrice || 0,
                    squareFeet: formData.property?.propertySize || null,
                    units: formData.property?.totalUnits || null,
                    financingType: formData.property?.isCashPurchase ? 'cash' : 'financed',
                  })
                })
                
                const dealData = await dealResponse.json()
                
                if (dealData.success) {
                  console.log('✅ Deal created successfully!')
                  console.log('📍 New deal MongoDB ID:', dealData.deal.id)
                  console.log('📍 New deal ID (7-digit):', dealData.deal.dealId)
                  console.log('📍 Deal ID type:', typeof dealData.deal.dealId)
                  setSuccessMessage({
                    title: 'Success!',
                    message: `Analysis saved and Deal #${dealData.deal.dealId} created in DealIQ!`
                  })
                  setShowSuccessToast(true)
                } else {
                  console.error('❌ Failed to create deal:', dealData.error)
                  setSuccessMessage({
                    title: 'Analysis Saved',
                    message: 'Warning: Failed to create deal in DealIQ. Please try again.'
                  })
                  setShowSuccessToast(true)
                }
              }
            } else {
              console.error('❌ Failed to fetch existing deals:', existingDealsData.error)
              setSuccessMessage({
                title: 'Analysis Saved',
                message: 'Warning: Failed to check for existing deals.'
              })
              setShowSuccessToast(true)
            }
          } catch (dealError) {
            console.error('❌ Error in deal creation flow:', dealError)
            setSuccessMessage({
              title: 'Analysis Saved',
              message: 'Warning: Failed to create deal in DealIQ. Please try again.'
            })
            setShowSuccessToast(true)
          }
        } else if (!saveOptions.createDeal) {
          // User didn't check the box - show normal success message
          setSuccessMessage({
            title: 'Success!',
            message: 'Analysis saved successfully!'
          })
          setShowSuccessToast(true)
        }
        
      } else {
        // Trial/Free user - save to localStorage
        await saveDraft(formData, 4, pendingCalculation, saveOptions.propertyName)
        console.log('✅ Saved analysis to localStorage')
        setSuccessMessage({
          title: 'Saved Locally!',
          message: 'Analysis draft saved to your browser.'
        })
        setShowSuccessToast(true)
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
    console.log('🔄 Starting new analysis - clearing URL and form')
    
    // Clear form data
    const newDraft = createNewDraft()
    setFormData(newDraft.data)
    setCurrentStep(1)
    setResults(null)
    setHasLoadedInitialDraft(true)
    
    // ✅ CRITICAL FIX: Navigate to /dashboard (no params) to clear analysisId from URL
    // This prevents the form from reloading the old analysis
    router.push('/dashboard')
  }

  // ✅ NEW: Clear Form button handler
  const handleResetForm = () => {
    if (window.confirm('Are you sure you want to clear this form? All entered data will be lost.')) {
      console.log('🧹 Resetting form to empty state')
      setFormData({
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
      setCurrentStep(1)
      setResults(null)
    }
  }

  // Show loading state while fetching analysis from database or initial draft loads
  // ✅ FIXED: Don't show loading if we have initialDealData
  if (isLoadingAnalysis || (!hasLoadedInitialDraft && !draftId && !initialDealData)) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-neutral-600">
          {isLoadingAnalysis ? 'Loading analysis...' : 'Preparing analysis tool...'}
        </p>
      </div>
    )
  }

  // ✅ DEBUG: Log formData.property on every render
  console.log('🎨 RENDERING PropertyAnalysisForm, formData.property:', {
    address: formData.property?.address || '(empty)',
    city: formData.property?.city || '(empty)',
    purchasePrice: formData.property?.purchasePrice || 0,
    downPayment: formData.property?.downPayment || 0,
    totalUnits: formData.property?.totalUnits || 0
  })

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
        linkedDealId={initialDealData?.dealId || null}  // ✅ Pass the deal ID!
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Property Analysis
          </h1>
          {draft?.name && (
            <p className="text-neutral-600 mt-1">{draft.name}</p>
          )}
        </div>
        
        {/* ✅ Clear Form button (only show on step 1 if form has data) */}
        {currentStep === 1 && formData.property?.address && (
          <Button
            variant="secondary"
            onClick={handleResetForm}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Clear Form
          </Button>
        )}
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
            propertySize={formData.property?.propertySize || 0}
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

      {/* Validation Error Modal - NEW */}
      {showValidationError && (
        <ValidationError
          errors={validationErrors}
          onClose={() => {
            setShowValidationError(false)
            setValidationErrors([])
          }}
        />
      )}

      {/* Success Toast */}
      <SuccessToast
        isOpen={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        title={successMessage.title}
        message={successMessage.message}
        duration={4000}
      />
    </div>
  )
}