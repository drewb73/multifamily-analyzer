// FILE LOCATION: /src/components/dealiq/AccountDetailsTab.tsx
// PURPOSE: Complete Account Details tab with all financial tracking fields
// ADDED: Commission, Enhanced Financing, Deal Value cards

'use client'

import { useState, useEffect } from 'react'
import { 
  MapPin, 
  Building2, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Edit2,
  Check,
  X,
  Home,
  Ruler,
  Hash,
  Receipt,
  Percent,
  Calculator
} from 'lucide-react'
import { 
  DEAL_STAGES, 
  FORECAST_STATUS,
  getStageLabel,
  getStageColors,
  getForecastLabel,
  formatCurrency,
  formatPercentage,
  calculateDaysInPipeline
} from '@/lib/dealiq-constants'

interface Deal {
  id: string
  dealId: string
  address: string
  city: string | null
  state: string | null
  zipCode: string | null
  stage: string
  forecastStatus: string
  expectedCloseDate: Date | null
  price: number
  squareFeet: number | null
  units: number | null
  pricePerUnit: number | null
  pricePerSqft: number | null
  financingType: string | null
  createdAt: Date
  analysis: any
  // New fields
  commissionPercent: number | null
  commissionAmount: number | null
  originalPurchasePrice: number | null
  netValue: number | null
  loanRate: number | null
  loanTerm: number | null
}

interface AccountDetailsTabProps {
  deal: Deal
  onUpdate: (updates: Partial<Deal>) => Promise<void>
}

export function AccountDetailsTab({ deal, onUpdate }: AccountDetailsTabProps) {
  const [isEditingStage, setIsEditingStage] = useState(false)
  const [isEditingForecast, setIsEditingForecast] = useState(false)
  const [isEditingCloseDate, setIsEditingCloseDate] = useState(false)
  const [isEditingCommission, setIsEditingCommission] = useState(false)
  const [isEditingLoanRate, setIsEditingLoanRate] = useState(false)
  const [isEditingLoanTerm, setIsEditingLoanTerm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [tempStage, setTempStage] = useState(deal.stage)
  const [tempForecast, setTempForecast] = useState(deal.forecastStatus)
  const [tempCloseDate, setTempCloseDate] = useState(() => {
    if (!deal.expectedCloseDate) return ''
    // Format date to YYYY-MM-DD in local timezone to avoid timezone shift
    const date = new Date(deal.expectedCloseDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [tempCommissionPercent, setTempCommissionPercent] = useState(deal.commissionPercent || 0)
  const [tempLoanRate, setTempLoanRate] = useState(deal.loanRate || 0)
  const [tempLoanTerm, setTempLoanTerm] = useState(deal.loanTerm || 30)

  // Format created date as mm/dd/yyyy
  const createdDate = new Date(deal.createdAt).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  })

  // Calculate commission amount
  const commissionAmount = deal.commissionPercent 
    ? (deal.price * (deal.commissionPercent / 100))
    : (deal.commissionAmount || 0)

  // Calculate loan details from analysis if available
  let downPayment = 0
  let loanAmount = 0
  let monthlyPayment = 0

  if (deal.analysis?.data) {
    const analysisData = typeof deal.analysis.data === 'string' 
      ? JSON.parse(deal.analysis.data)
      : deal.analysis.data

    if (analysisData?.property) {
      if (!analysisData.property.isCashPurchase) {
        downPayment = analysisData.property.downPayment || 0
        loanAmount = deal.price - downPayment
        
        const rate = (deal.loanRate || analysisData.property.interestRate || 6.5) / 100 / 12
        const term = (deal.loanTerm || analysisData.property.loanTerm || 30) * 12
        
        if (loanAmount > 0 && rate > 0 && term > 0) {
          monthlyPayment = loanAmount * rate * Math.pow(1 + rate, term) / (Math.pow(1 + rate, term) - 1)
        }
      }
    }
  }

  // Get metrics and breakdown from linked analysis
  let metrics = null
  let monthlyBreakdown = null
  let analysisData = null
  
  if (deal.analysis) {
    metrics = deal.analysis.results?.keyMetrics
    monthlyBreakdown = deal.analysis.results?.monthlyBreakdown
    analysisData = deal.analysis.data
    
    if (!metrics && typeof deal.analysis.results === 'string') {
      try {
        const parsedResults = JSON.parse(deal.analysis.results)
        metrics = parsedResults.keyMetrics
        monthlyBreakdown = parsedResults.monthlyBreakdown
      } catch (e) {
        console.error('Failed to parse results:', e)
      }
    }
    
    if (analysisData && typeof deal.analysis.data === 'string') {
      try {
        analysisData = JSON.parse(deal.analysis.data)
      } catch (e) {
        console.error('Failed to parse data:', e)
      }
    }
  }

  const handleSaveStage = async () => {
    setIsSaving(true)
    try {
      await onUpdate({ stage: tempStage })
      setIsEditingStage(false)
    } catch (error) {
      console.error('Failed to update stage:', error)
      alert('Failed to update stage')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveForecast = async () => {
    setIsSaving(true)
    try {
      await onUpdate({ forecastStatus: tempForecast })
      setIsEditingForecast(false)
    } catch (error) {
      console.error('Failed to update forecast:', error)
      alert('Failed to update forecast')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCloseDate = async () => {
    setIsSaving(true)
    try {
      // Fix timezone issue by appending noon time to avoid day shifting
      const newDate = tempCloseDate ? new Date(tempCloseDate + 'T12:00:00') : null
      await onUpdate({ expectedCloseDate: newDate })
      setIsEditingCloseDate(false)
    } catch (error) {
      console.error('Failed to update close date:', error)
      alert('Failed to update close date')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCommission = async () => {
    setIsSaving(true)
    try {
      const calculatedAmount = deal.price * (tempCommissionPercent / 100)
      await onUpdate({ 
        commissionPercent: tempCommissionPercent,
        commissionAmount: calculatedAmount
      })
      setIsEditingCommission(false)
    } catch (error) {
      console.error('Failed to update commission:', error)
      alert('Failed to update commission')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveLoanRate = async () => {
    setIsSaving(true)
    try {
      await onUpdate({ loanRate: tempLoanRate })
      setIsEditingLoanRate(false)
    } catch (error) {
      console.error('Failed to update loan rate:', error)
      alert('Failed to update loan rate')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveLoanTerm = async () => {
    setIsSaving(true)
    try {
      await onUpdate({ loanTerm: tempLoanTerm })
      setIsEditingLoanTerm(false)
    } catch (error) {
      console.error('Failed to update loan term:', error)
      alert('Failed to update loan term')
    } finally {
      setIsSaving(false)
    }
  }


  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Calculate P&L with Current vs Market Rents
  const calculatePL = () => {
    if (!analysisData || !monthlyBreakdown) return null

    const unitMix = analysisData.unitMix || []
    const income = analysisData.income || []
    const expenses = analysisData.expenses || []

    const currentRentalIncome = unitMix.reduce((sum: number, unit: any) => 
      sum + ((unit.currentRent || 0) * (unit.count || 0)), 0
    )
    
    const marketRentalIncome = unitMix.reduce((sum: number, unit: any) => 
      sum + ((unit.marketRent || 0) * (unit.count || 0)), 0
    )

    const otherIncome = income
      .filter((inc: any) => !inc.isCalculated)
      .reduce((sum: number, inc: any) => sum + (inc.amount || 0), 0)

    const totalIncomeCurrent = currentRentalIncome + otherIncome
    const totalIncomeMarket = marketRentalIncome + otherIncome

    const expenseBreakdown = expenses.map((expense: any) => {
      let currentAmount = 0
      let marketAmount = 0

      if (expense.isPercentage) {
        if (expense.percentageOf === 'rent') {
          currentAmount = currentRentalIncome * (expense.amount / 100)
          marketAmount = marketRentalIncome * (expense.amount / 100)
        } else if (expense.percentageOf === 'income') {
          currentAmount = totalIncomeCurrent * (expense.amount / 100)
          marketAmount = totalIncomeMarket * (expense.amount / 100)
        } else if (expense.percentageOf === 'propertyValue') {
          const monthlyAmount = (deal.price * (expense.amount / 100)) / 12
          currentAmount = monthlyAmount
          marketAmount = monthlyAmount
        }
      } else {
        currentAmount = expense.amount
        marketAmount = expense.amount
      }

      return {
        name: expense.name,
        currentAmount,
        marketAmount
      }
    })

    const totalExpensesCurrent = expenseBreakdown.reduce((sum: number, exp: any) => sum + exp.currentAmount, 0)
    const totalExpensesMarket = expenseBreakdown.reduce((sum: number, exp: any) => sum + exp.marketAmount, 0)

    const noiCurrent = totalIncomeCurrent - totalExpensesCurrent
    const noiMarket = totalIncomeMarket - totalExpensesMarket

    const mortgagePayment = monthlyBreakdown.mortgagePayment || 0

    const cashFlowCurrent = noiCurrent - mortgagePayment
    const cashFlowMarket = noiMarket - mortgagePayment

    return {
      current: {
        rentalIncome: currentRentalIncome,
        otherIncome,
        totalIncome: totalIncomeCurrent,
        expenses: expenseBreakdown.map((e: any) => ({ name: e.name, amount: e.currentAmount })),
        totalExpenses: totalExpensesCurrent,
        noi: noiCurrent,
        debtService: mortgagePayment,
        cashFlow: cashFlowCurrent
      },
      market: {
        rentalIncome: marketRentalIncome,
        otherIncome,
        totalIncome: totalIncomeMarket,
        expenses: expenseBreakdown.map((e: any) => ({ name: e.name, amount: e.marketAmount })),
        totalExpenses: totalExpensesMarket,
        noi: noiMarket,
        debtService: mortgagePayment,
        cashFlow: cashFlowMarket
      }
    }
  }

  const plData = calculatePL()

  return (
    <div className="space-y-6">
      {/* Property Information Card */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-bold text-neutral-900">Property Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Address */}
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <MapPin className="w-4 h-4" />
              Address
            </div>
            <div className="font-medium text-neutral-900">{deal.address}</div>
            {(deal.city || deal.state) && (
              <div className="text-sm text-neutral-600">
                {deal.city}{deal.city && deal.state ? ', ' : ''}{deal.state} {deal.zipCode}
              </div>
            )}
          </div>

          {/* Units */}
          {deal.units && (
            <div>
              <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
                <Home className="w-4 h-4" />
                Units
              </div>
              <div className="font-medium text-neutral-900">{deal.units} units</div>
              {deal.pricePerUnit && (
                <div className="text-sm text-neutral-600">
                  {formatCurrency(deal.pricePerUnit)}/unit
                </div>
              )}
            </div>
          )}

          {/* Square Feet */}
          {deal.squareFeet && (
            <div>
              <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
                <Ruler className="w-4 h-4" />
                Square Feet
              </div>
              <div className="font-medium text-neutral-900">
                {deal.squareFeet.toLocaleString()} sq ft
              </div>
              {deal.pricePerSqft && (
                <div className="text-sm text-neutral-600">
                  {formatCurrency(deal.pricePerSqft)}/sq ft
                </div>
              )}
            </div>
          )}

          {/* Purchase Price */}
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <DollarSign className="w-4 h-4" />
              Purchase Price
            </div>
            <div className="font-medium text-neutral-900">{formatCurrency(deal.price)}</div>
          </div>

          {/* Financing Type */}
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <Hash className="w-4 h-4" />
              Financing
            </div>
            <div className="font-medium text-neutral-900 capitalize">
              {deal.financingType || 'Not specified'}
            </div>
          </div>
        </div>
      </div>

      {/* Deal Tracking Card */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-bold text-neutral-900">Deal Tracking</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Stage */}
          <div className="min-w-0">
            <div className="text-sm text-neutral-500 mb-2">Stage</div>
            {!isEditingStage ? (
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStageColors(deal.stage).bg} ${getStageColors(deal.stage).text} truncate max-w-full`}>
                  {getStageLabel(deal.stage)}
                </span>
                <button
                  onClick={() => {
                    setTempStage(deal.stage)
                    setIsEditingStage(true)
                  }}
                  className="text-neutral-400 hover:text-primary-600 transition-colors flex-shrink-0"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <select
                  value={tempStage}
                  onChange={(e) => setTempStage(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isSaving}
                >
                  {DEAL_STAGES.map(stage => (
                    <option key={stage.id} value={stage.id}>
                      {stage.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSaveStage}
                  disabled={isSaving}
                  className="text-success-600 hover:text-success-700 disabled:opacity-50 flex-shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingStage(false)}
                  disabled={isSaving}
                  className="text-error-600 hover:text-error-700 disabled:opacity-50 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Forecast */}
          <div className="min-w-0">
            <div className="text-sm text-neutral-500 mb-2">Forecast Status</div>
            {!isEditingForecast ? (
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">
                  {getForecastLabel(deal.forecastStatus)}
                </span>
                <button
                  onClick={() => {
                    setTempForecast(deal.forecastStatus)
                    setIsEditingForecast(true)
                  }}
                  className="text-neutral-400 hover:text-primary-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={tempForecast}
                  onChange={(e) => setTempForecast(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isSaving}
                >
                  {FORECAST_STATUS.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSaveForecast}
                  disabled={isSaving}
                  className="text-success-600 hover:text-success-700 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingForecast(false)}
                  disabled={isSaving}
                  className="text-error-600 hover:text-error-700 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Expected Close Date */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
              <Calendar className="w-4 h-4" />
              Expected Close
            </div>
            {!isEditingCloseDate ? (
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">
                  {formatDate(deal.expectedCloseDate)}
                </span>
                <button
                  onClick={() => {
                    setTempCloseDate(
                      deal.expectedCloseDate 
                        ? new Date(deal.expectedCloseDate).toISOString().split('T')[0]
                        : ''
                    )
                    setIsEditingCloseDate(true)
                  }}
                  className="text-neutral-400 hover:text-primary-600 transition-colors flex-shrink-0"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="date"
                  value={tempCloseDate}
                  onChange={(e) => setTempCloseDate(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isSaving}
                />
                <button
                  onClick={handleSaveCloseDate}
                  disabled={isSaving}
                  className="text-success-600 hover:text-success-700 disabled:opacity-50 flex-shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingCloseDate(false)}
                  disabled={isSaving}
                  className="text-error-600 hover:text-error-700 disabled:opacity-50 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Created */}
          <div className="min-w-0">
            <div className="text-sm text-neutral-500 mb-2">Created</div>
            <div className="font-medium text-neutral-900">{createdDate}</div>
          </div>
        </div>
      </div>

      {/* ========================================
          ✨ NEW: Commission Details Card
          ======================================== */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-bold text-neutral-900">Commission Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Commission Percent */}
          <div>
            <div className="text-sm text-neutral-500 mb-2">Expected Commission %</div>
            {!isEditingCommission ? (
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">
                  {deal.commissionPercent ? `${deal.commissionPercent.toFixed(2)}%` : 'Not set'}
                </span>
                <button
                  onClick={() => {
                    setTempCommissionPercent(deal.commissionPercent || 0)
                    setIsEditingCommission(true)
                  }}
                  className="text-neutral-400 hover:text-primary-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={tempCommissionPercent}
                  onChange={(e) => setTempCommissionPercent(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isSaving}
                />
                <button
                  onClick={handleSaveCommission}
                  disabled={isSaving}
                  className="text-success-600 hover:text-success-700 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingCommission(false)}
                  disabled={isSaving}
                  className="text-error-600 hover:text-error-700 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Commission Amount */}
          <div>
            <div className="text-sm text-neutral-500 mb-2">Expected Commission Amount</div>
            <div className="font-medium text-neutral-900">
              {formatCurrency(commissionAmount)}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Auto-calculated from price
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          ✨ NEW: Enhanced Financing Details Card
          ======================================== */}
      {deal.financingType === 'financed' && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-neutral-900">Financing Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Purchase Price */}
            <div>
              <div className="text-sm text-neutral-500 mb-1">Purchase Price</div>
              <div className="font-medium text-neutral-900">{formatCurrency(deal.price)}</div>
            </div>

            {/* Down Payment */}
            <div>
              <div className="text-sm text-neutral-500 mb-1">Down Payment</div>
              <div className="font-medium text-neutral-900">{formatCurrency(downPayment)}</div>
              <div className="text-xs text-neutral-500 mt-1">
                {downPayment > 0 ? `${((downPayment / deal.price) * 100).toFixed(1)}% down` : ''}
              </div>
            </div>

            {/* Loan Amount */}
            <div>
              <div className="text-sm text-neutral-500 mb-1">Loan Amount</div>
              <div className="font-medium text-neutral-900">{formatCurrency(loanAmount)}</div>
            </div>

            {/* Interest Rate */}
            <div>
              <div className="text-sm text-neutral-500 mb-2">Interest Rate</div>
              {!isEditingLoanRate ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900">
                    {deal.loanRate ? `${deal.loanRate.toFixed(3)}%` : 'From analysis'}
                  </span>
                  <button
                    onClick={() => {
                      setTempLoanRate(deal.loanRate || 6.5)
                      setIsEditingLoanRate(true)
                    }}
                    className="text-neutral-400 hover:text-primary-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="20"
                    value={tempLoanRate}
                    onChange={(e) => setTempLoanRate(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={isSaving}
                  />
                  <button
                    onClick={handleSaveLoanRate}
                    disabled={isSaving}
                    className="text-success-600 hover:text-success-700 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingLoanRate(false)}
                    disabled={isSaving}
                    className="text-error-600 hover:text-error-700 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Loan Term */}
            <div>
              <div className="text-sm text-neutral-500 mb-2">Loan Term</div>
              {!isEditingLoanTerm ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900">
                    {deal.loanTerm ? `${deal.loanTerm} years` : 'From analysis'}
                  </span>
                  <button
                    onClick={() => {
                      setTempLoanTerm(deal.loanTerm || 30)
                      setIsEditingLoanTerm(true)
                    }}
                    className="text-neutral-400 hover:text-primary-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="40"
                    value={tempLoanTerm}
                    onChange={(e) => setTempLoanTerm(parseInt(e.target.value) || 30)}
                    className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={isSaving}
                  />
                  <button
                    onClick={handleSaveLoanTerm}
                    disabled={isSaving}
                    className="text-success-600 hover:text-success-700 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingLoanTerm(false)}
                    disabled={isSaving}
                    className="text-error-600 hover:text-error-700 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Monthly Payment */}
            <div>
              <div className="text-sm text-neutral-500 mb-1">Monthly Payment</div>
              <div className="font-medium text-neutral-900">{formatCurrency(monthlyPayment)}</div>
              <div className="text-xs text-neutral-500 mt-1">
                Principal + Interest
              </div>
            </div>
          </div>
        </div>
      )}

      {/* P&L Statement with Current vs Market */}
      {plData && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">Profit & Loss Statement</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-500">Monthly</span>
              {deal.analysis && (
                <a
                  href={`/dashboard?analysisId=${deal.analysis.id}`}
                  className="text-sm text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                >
                  📊 View Analysis
                </a>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-4 pb-2 border-b border-neutral-200">
              <div></div>
              <div className="text-sm font-semibold text-neutral-600 text-right">Current</div>
              <div className="text-sm font-semibold text-neutral-600 text-right">Market</div>
            </div>

            {/* INCOME */}
            <div>
              <div className="text-sm font-semibold text-neutral-900 mb-3">INCOME</div>
              <div className="space-y-2 ml-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-neutral-700">Rental Income:</div>
                  <div className="text-sm text-neutral-900 text-right font-medium">
                    {formatCurrency(plData.current.rentalIncome)}
                  </div>
                  <div className="text-sm text-neutral-900 text-right font-medium">
                    {formatCurrency(plData.market.rentalIncome)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-neutral-700">Other Income:</div>
                  <div className="text-sm text-neutral-900 text-right font-medium">
                    {formatCurrency(plData.current.otherIncome)}
                  </div>
                  <div className="text-sm text-neutral-900 text-right font-medium">
                    {formatCurrency(plData.market.otherIncome)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-neutral-100">
                  <div className="text-sm font-semibold text-neutral-900">Total Income:</div>
                  <div className="text-sm font-bold text-neutral-900 text-right">
                    {formatCurrency(plData.current.totalIncome)}
                  </div>
                  <div className="text-sm font-bold text-neutral-900 text-right">
                    {formatCurrency(plData.market.totalIncome)}
                  </div>
                </div>
              </div>
            </div>

            {/* OPERATING EXPENSES */}
            <div>
              <div className="text-sm font-semibold text-neutral-900 mb-3">OPERATING EXPENSES</div>
              <div className="space-y-2 ml-4">
                {plData.current.expenses.map((expense: any, index: number) => (
                  <div key={index} className="grid grid-cols-3 gap-4">
                    <div className="text-sm text-neutral-700">{expense.name}:</div>
                    <div className="text-sm text-neutral-900 text-right font-medium">
                      {formatCurrency(expense.amount)}
                    </div>
                    <div className="text-sm text-neutral-900 text-right font-medium">
                      {formatCurrency(plData.market.expenses[index].amount)}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-neutral-100">
                  <div className="text-sm font-semibold text-neutral-900">Total Expenses:</div>
                  <div className="text-sm font-bold text-neutral-900 text-right">
                    {formatCurrency(plData.current.totalExpenses)}
                  </div>
                  <div className="text-sm font-bold text-neutral-900 text-right">
                    {formatCurrency(plData.market.totalExpenses)}
                  </div>
                </div>
              </div>
            </div>

            {/* NET OPERATING INCOME */}
            <div className="grid grid-cols-3 gap-4 py-3 border-y-2 border-primary-200 bg-primary-50/30">
              <div className="text-sm font-bold text-neutral-900">NET OPERATING INCOME</div>
              <div className="text-sm font-bold text-primary-700 text-right">
                {formatCurrency(plData.current.noi)}
              </div>
              <div className="text-sm font-bold text-primary-700 text-right">
                {formatCurrency(plData.market.noi)}
              </div>
            </div>

            {/* DEBT SERVICE */}
            <div>
              <div className="text-sm font-semibold text-neutral-900 mb-3">DEBT SERVICE</div>
              <div className="grid grid-cols-3 gap-4 ml-4">
                <div className="text-sm text-neutral-700">Mortgage Payment:</div>
                <div className="text-sm text-neutral-900 text-right font-medium">
                  {formatCurrency(plData.current.debtService)}
                </div>
                <div className="text-sm text-neutral-900 text-right font-medium">
                  {formatCurrency(plData.market.debtService)}
                </div>
              </div>
            </div>

            {/* CASH FLOW */}
            <div className="grid grid-cols-3 gap-4 py-3 border-y-2 border-neutral-300 bg-neutral-50">
              <div className="text-base font-bold text-neutral-900">CASH FLOW</div>
              <div className={`text-base font-bold text-right ${plData.current.cashFlow >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {formatCurrency(plData.current.cashFlow)}
              </div>
              <div className={`text-base font-bold text-right ${plData.market.cashFlow >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {formatCurrency(plData.market.cashFlow)}
              </div>
            </div>

            {/* ANNUAL SUMMARY */}
            <div className="pt-4 border-t border-neutral-200">
              <div className="text-sm font-semibold text-neutral-900 mb-3">ANNUAL SUMMARY</div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="text-neutral-600">• Annual Income:</div>
                <div className="text-neutral-900 text-right font-medium">
                  {formatCurrency(plData.current.totalIncome * 12)}
                </div>
                <div className="text-neutral-900 text-right font-medium">
                  {formatCurrency(plData.market.totalIncome * 12)}
                </div>
                
                <div className="text-neutral-600">• Annual Expenses:</div>
                <div className="text-neutral-900 text-right font-medium">
                  {formatCurrency(plData.current.totalExpenses * 12)}
                </div>
                <div className="text-neutral-900 text-right font-medium">
                  {formatCurrency(plData.market.totalExpenses * 12)}
                </div>
                
                <div className="text-neutral-600">• Annual NOI:</div>
                <div className="text-neutral-900 text-right font-medium">
                  {formatCurrency(plData.current.noi * 12)}
                </div>
                <div className="text-neutral-900 text-right font-medium">
                  {formatCurrency(plData.market.noi * 12)}
                </div>
                
                <div className="text-neutral-600">• Annual Debt Service:</div>
                <div className="text-neutral-900 text-right font-medium">
                  {formatCurrency(plData.current.debtService * 12)}
                </div>
                <div className="text-neutral-900 text-right font-medium">
                  {formatCurrency(plData.market.debtService * 12)}
                </div>
                
                <div className="text-neutral-600 font-semibold">• Annual Cash Flow:</div>
                <div className={`text-right font-bold ${plData.current.cashFlow * 12 >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                  {formatCurrency(plData.current.cashFlow * 12)}
                </div>
                <div className={`text-right font-bold ${plData.market.cashFlow * 12 >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                  {formatCurrency(plData.market.cashFlow * 12)}
                </div>
              </div>
            </div>

            {/* KEY METRICS */}
            {metrics && (
              <div className="pt-4 border-t border-neutral-200">
                <div className="text-sm font-semibold text-neutral-900 mb-3">KEY METRICS</div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  {/* Cap Rate */}
                  <div className="text-neutral-600">• Cap Rate:</div>
                  <div className="text-neutral-900 text-right font-medium">
                    {plData.current.noi * 12 > 0 
                      ? formatPercentage((plData.current.noi * 12 / deal.price) * 100, 2)
                      : 'N/A'}
                  </div>
                  <div className="text-neutral-900 text-right font-medium">
                    {plData.market.noi * 12 > 0 
                      ? formatPercentage((plData.market.noi * 12 / deal.price) * 100, 2)
                      : 'N/A'}
                  </div>
                  
                  {/* Cash-on-Cash Return */}
                  {metrics.totalInvestment && metrics.totalInvestment > 0 && (
                    <>
                      <div className="text-neutral-600">• Cash-on-Cash:</div>
                      <div className="text-neutral-900 text-right font-medium">
                        {formatPercentage((plData.current.cashFlow * 12 / metrics.totalInvestment) * 100, 2)}
                      </div>
                      <div className="text-neutral-900 text-right font-medium">
                        {formatPercentage((plData.market.cashFlow * 12 / metrics.totalInvestment) * 100, 2)}
                      </div>
                    </>
                  )}
                  
                  {/* GRM */}
                  <div className="text-neutral-600">• GRM:</div>
                  <div className="text-neutral-900 text-right font-medium">
                    {plData.current.rentalIncome * 12 > 0 
                      ? (deal.price / (plData.current.rentalIncome * 12)).toFixed(2)
                      : 'N/A'}
                  </div>
                  <div className="text-neutral-900 text-right font-medium">
                    {plData.market.rentalIncome * 12 > 0 
                      ? (deal.price / (plData.market.rentalIncome * 12)).toFixed(2)
                      : 'N/A'}
                  </div>
                  
                  {/* DSCR */}
                  <div className="text-neutral-600">• DSCR:</div>
                  <div className="text-neutral-900 text-right font-medium">
                    {plData.current.debtService > 0 
                      ? (plData.current.noi / plData.current.debtService).toFixed(2)
                      : 'N/A'}
                  </div>
                  <div className="text-neutral-900 text-right font-medium">
                    {plData.market.debtService > 0 
                      ? (plData.market.noi / plData.market.debtService).toFixed(2)
                      : 'N/A'}
                  </div>
                </div>
                
                {/* Metrics that don't vary */}
                <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-600">
                  <div className="grid grid-cols-2 gap-2">
                    <div>• Total Investment: <span className="font-medium text-neutral-900">{formatCurrency(metrics.totalInvestment)}</span></div>
                    {deal.units && <div>• Price/Unit: <span className="font-medium text-neutral-900">{formatCurrency(deal.price / deal.units)}</span></div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Metrics Message */}
      {!metrics && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>No analysis linked.</strong> Key metrics and P&L will appear here when you link a property analysis to this deal.
          </p>
        </div>
      )}
    </div>
  )
}