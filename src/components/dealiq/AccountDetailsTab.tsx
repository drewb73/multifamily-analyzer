// FILE LOCATION: /src/components/dealiq/AccountDetailsTab.tsx
// PURPOSE: Account Details tab content for deal detail page
// FIXED: Better analysis data handling and debugging

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
  Hash
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
}

interface AccountDetailsTabProps {
  deal: Deal
  onUpdate: (updates: Partial<Deal>) => Promise<void>
}

export function AccountDetailsTab({ deal, onUpdate }: AccountDetailsTabProps) {
  const [isEditingStage, setIsEditingStage] = useState(false)
  const [isEditingForecast, setIsEditingForecast] = useState(false)
  const [isEditingCloseDate, setIsEditingCloseDate] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [tempStage, setTempStage] = useState(deal.stage)
  const [tempForecast, setTempForecast] = useState(deal.forecastStatus)
  const [tempCloseDate, setTempCloseDate] = useState(
    deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split('T')[0] : ''
  )

  const daysInPipeline = calculateDaysInPipeline(new Date(deal.createdAt))

  // ========================================
  // ✨ IMPROVED: Better analysis data extraction with debugging
  // ========================================
  useEffect(() => {
    console.log('📊 Deal analysis data:', {
      hasAnalysis: !!deal.analysis,
      analysisId: deal.analysis?.id,
      analysisName: deal.analysis?.name,
      hasResults: !!deal.analysis?.results,
      resultsType: typeof deal.analysis?.results,
      results: deal.analysis?.results,
      keyMetrics: deal.analysis?.results?.keyMetrics
    })
  }, [deal.analysis])

  // Get metrics from linked analysis
  // Try multiple possible structures
  let metrics = null
  
  if (deal.analysis) {
    // Try direct access first
    metrics = deal.analysis.results?.keyMetrics
    
    // If results is a string, parse it
    if (!metrics && typeof deal.analysis.results === 'string') {
      try {
        const parsedResults = JSON.parse(deal.analysis.results)
        metrics = parsedResults.keyMetrics
        console.log('✅ Parsed metrics from string:', metrics)
      } catch (e) {
        console.error('Failed to parse results:', e)
      }
    }
    
    // Log final metrics state
    console.log('📈 Final metrics:', metrics)
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
      const newDate = tempCloseDate ? new Date(tempCloseDate) : null
      await onUpdate({ expectedCloseDate: newDate })
      setIsEditingCloseDate(false)
    } catch (error) {
      console.error('Failed to update close date:', error)
      alert('Failed to update close date')
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stage */}
          <div>
            <div className="text-sm text-neutral-500 mb-2">Stage</div>
            {!isEditingStage ? (
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStageColors(deal.stage).bg} ${getStageColors(deal.stage).text}`}>
                  {getStageLabel(deal.stage)}
                </span>
                <button
                  onClick={() => {
                    setTempStage(deal.stage)
                    setIsEditingStage(true)
                  }}
                  className="text-neutral-400 hover:text-primary-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={tempStage}
                  onChange={(e) => setTempStage(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  className="text-success-600 hover:text-success-700 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingStage(false)}
                  disabled={isSaving}
                  className="text-error-600 hover:text-error-700 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Forecast */}
          <div>
            <div className="text-sm text-neutral-500 mb-2">Forecast</div>
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
          <div>
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
                  className="text-neutral-400 hover:text-primary-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={tempCloseDate}
                  onChange={(e) => setTempCloseDate(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isSaving}
                />
                <button
                  onClick={handleSaveCloseDate}
                  disabled={isSaving}
                  className="text-success-600 hover:text-success-700 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingCloseDate(false)}
                  disabled={isSaving}
                  className="text-error-600 hover:text-error-700 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Days in Pipeline */}
          <div>
            <div className="text-sm text-neutral-500 mb-2">Days in Pipeline</div>
            <div className="font-medium text-neutral-900">{daysInPipeline} days</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Card */}
      {metrics && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">Key Metrics</h3>
            </div>
            {deal.analysis && (
              <span className="text-sm text-neutral-500">
                From analysis: {deal.analysis.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Cap Rate */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="text-xs text-neutral-500 mb-1">Cap Rate</div>
              <div className="text-2xl font-bold text-neutral-900">
                {formatPercentage(metrics.capRate * 100, 2)}
              </div>
            </div>

            {/* Cash-on-Cash */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="text-xs text-neutral-500 mb-1">Cash-on-Cash</div>
              <div className="text-2xl font-bold text-neutral-900">
                {formatPercentage(metrics.cashOnCashReturn * 100, 2)}
              </div>
            </div>

            {/* NOI */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="text-xs text-neutral-500 mb-1">Annual NOI</div>
              <div className="text-xl font-bold text-neutral-900">
                {formatCurrency(metrics.netOperatingIncome)}
              </div>
            </div>

            {/* Cash Flow */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="text-xs text-neutral-500 mb-1">Annual Cash Flow</div>
              <div className="text-xl font-bold text-neutral-900">
                {formatCurrency(metrics.annualCashFlow)}
              </div>
            </div>

            {/* GRM */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="text-xs text-neutral-500 mb-1">GRM</div>
              <div className="text-2xl font-bold text-neutral-900">
                {metrics.grossRentMultiplier.toFixed(2)}
              </div>
            </div>

            {/* DSCR */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="text-xs text-neutral-500 mb-1">DSCR</div>
              <div className="text-2xl font-bold text-neutral-900">
                {metrics.debtServiceCoverageRatio === Infinity 
                  ? '∞' 
                  : metrics.debtServiceCoverageRatio.toFixed(2)}
              </div>
            </div>

            {/* Total Investment */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="text-xs text-neutral-500 mb-1">Total Investment</div>
              <div className="text-xl font-bold text-neutral-900">
                {formatCurrency(metrics.totalInvestment)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✨ IMPROVED: Better debug message */}
      {!metrics && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Debug Info:</strong>
          </p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Analysis linked: {deal.analysis ? 'Yes' : 'No'}</li>
            {deal.analysis && (
              <>
                <li>• Analysis ID: {deal.analysis.id}</li>
                <li>• Analysis name: {deal.analysis.name || 'Unnamed'}</li>
                <li>• Has results: {deal.analysis.results ? 'Yes' : 'No'}</li>
                <li>• Results type: {typeof deal.analysis.results}</li>
              </>
            )}
          </ul>
          <p className="text-sm text-blue-800 mt-3">
            Check browser console for detailed analysis data structure.
          </p>
        </div>
      )}
    </div>
  )
}