// FILE LOCATION: /src/app/dashboard/dealiq/page.tsx
// REVAMPED: Added search, sort/filters, fixed stage pills to match individual deal page
// BATCH E ITEM #4: Added route protection for DealIQ feature toggle

'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, Plus, Trash2, AlertTriangle, Search, Filter, Lock } from 'lucide-react'
import Link from 'next/link'
import { getStageLabel, getStageColors, getForecastLabel, DEAL_STAGES, FORECAST_STATUS, getOpportunityStatusLabel, getOpportunityStatusColors } from '@/lib/dealiq-constants'
import { CreateDealModal } from '@/components/dealiq/CreateDealModal'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { useUser } from '@clerk/nextjs'
import { LockedFeatureWrapper } from '@/components/dashboard/LockedFeatureWrapper'

interface Deal {
  id: string
  dealId: string
  address: string
  city: string | null
  state: string | null
  stage: string
  forecastStatus: string
  expectedCloseDate: Date | null
  createdAt: Date
  price: number
  units: number | null
  commissionPercent: number | null
  commissionAmount: number | null
}

type SortField = 'address' | 'stage' | 'forecastStatus' | 'expectedCloseDate' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export default function DealIQPage() {
  const router = useRouter()
  const { user } = useUser()
  const { settings, isLoading: settingsLoading } = useSystemSettings()
  
  const [deals, setDeals] = useState<Deal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // ✨ NEW: Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterStage, setFilterStage] = useState<string>('all')
  const [filterForecast, setFilterForecast] = useState<string>('all')

  // Access control state
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [canAccessDealIQ, setCanAccessDealIQ] = useState<boolean | null>(null)
  const [canStartTrial, setCanStartTrial] = useState(false)

  // ✅ BATCH E #4: Don't redirect - just show disabled message below

  // Check subscription status and access
  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          setSubscriptionStatus(data.subscriptionStatus)
          
          // Check if user can access DealIQ (only premium/enterprise)
          const isPremium = data.subscriptionStatus === 'premium' || data.subscriptionStatus === 'enterprise'
          setCanAccessDealIQ(isPremium)
          
          // Check if can start trial
          const isFree = data.subscriptionStatus === 'free'
          setCanStartTrial(isFree && !data.hasUsedTrial)
        }
      } catch (error) {
        console.error('Failed to check access:', error)
        setCanAccessDealIQ(false)
      }
    }
    
    if (user) {
      checkAccess()
    }
  }, [user])

  useEffect(() => {
    loadDeals()
  }, [])

  const loadDeals = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/dealiq')
      const data = await response.json()

      if (data.success) {
        setDeals(data.deals)
      } else {
        setError('Failed to load deals')
      }
    } catch (err) {
      console.error('Load deals error:', err)
      setError('Failed to load deals')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (dealId: string) => {
    try {
      setIsDeleting(true)
      console.log('🗑️ Deleting deal:', dealId)
      
      const response = await fetch(`/api/dealiq/${dealId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      console.log('Delete response:', data)

      if (data.success) {
        // Remove from local state
        setDeals(deals.filter(d => d.id !== dealId))
        setDeleteId(null)
        console.log('✅ Deal deleted successfully')
      } else {
        console.error('Delete failed:', data.error)
        alert('Failed to delete deal: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete deal: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsDeleting(false)
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // ✨ NEW: Filter and sort deals
  const filteredAndSortedDeals = useMemo(() => {
    let filtered = [...deals]

    // Filter by search query (address)
    if (searchQuery.trim()) {
      filtered = filtered.filter(deal => 
        deal.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deal.city && deal.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (deal.state && deal.state.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filter by stage
    if (filterStage !== 'all') {
      filtered = filtered.filter(deal => deal.stage === filterStage)
    }

    // Filter by forecast status
    if (filterForecast !== 'all') {
      filtered = filtered.filter(deal => deal.forecastStatus === filterForecast)
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'address':
          comparison = a.address.localeCompare(b.address)
          break
        case 'stage':
          const stageOrderA = DEAL_STAGES.find(s => s.id === a.stage)?.order ?? 999
          const stageOrderB = DEAL_STAGES.find(s => s.id === b.stage)?.order ?? 999
          comparison = stageOrderA - stageOrderB
          break
        case 'forecastStatus':
          comparison = a.forecastStatus.localeCompare(b.forecastStatus)
          break
        case 'expectedCloseDate':
          const dateA = a.expectedCloseDate ? new Date(a.expectedCloseDate).getTime() : 0
          const dateB = b.expectedCloseDate ? new Date(b.expectedCloseDate).getTime() : 0
          comparison = dateA - dateB
          break
        case 'createdAt':
          const createdA = new Date(a.createdAt).getTime()
          const createdB = new Date(b.createdAt).getTime()
          comparison = createdA - createdB
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [deals, searchQuery, filterStage, filterForecast, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // ✅ MOBILE: Toggle sort direction without changing field
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
  }

  // ✨ NEW: Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setFilterStage('all')
    setFilterForecast('all')
    setSortField('createdAt')
    setSortDirection('desc')
  }

  const hasActiveFilters = searchQuery.trim() || filterStage !== 'all' || filterForecast !== 'all'

  // ✅ BATCH E #4: Show loading while checking settings
  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Briefcase className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-pulse" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  // ✅ BATCH E #4: Show maintenance message if DealIQ is turned off
  if (settings && !settings.dealiqEnabled) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="elevated-card p-12 text-center max-w-md mx-auto">
          <Lock className="w-20 h-20 text-neutral-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-neutral-900 mb-3">Feature Disabled</h2>
          <p className="text-lg text-neutral-600 mb-4">
            DealIQ is currently unavailable.
          </p>
          <p className="text-sm text-neutral-500">
            This feature has been temporarily disabled by your administrator.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Briefcase className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-pulse" />
          <p className="text-neutral-600">Loading deals...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="elevated-card p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-error-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Error Loading Deals</h2>
        <p className="text-neutral-600 mb-4">{error}</p>
        <button onClick={loadDeals} className="btn-primary px-6 py-2">
          Try Again
        </button>
      </div>
    )
  }

  // Show loading while checking access
  if (canAccessDealIQ === null) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Show locked feature wrapper if no access
  if (!canAccessDealIQ) {
    return (
      <div className="max-w-4xl mx-auto">
        <LockedFeatureWrapper canStartTrial={canStartTrial} />
      </div>
    )
  }

  // User has access - show DealIQ interface
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        {/* Title Row - Always visible */}
        <div className="flex items-center justify-between mb-2 gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 truncate">DealIQ</h1>
          </div>
          
          {/* Desktop: Deal count + Create button */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-sm text-neutral-600 whitespace-nowrap">
              {filteredAndSortedDeals.length} {filteredAndSortedDeals.length === 1 ? 'deal' : 'deals'}
              {hasActiveFilters && deals.length !== filteredAndSortedDeals.length && (
                <span className="text-neutral-400"> (filtered from {deals.length})</span>
              )}
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Create New Deal
            </button>
          </div>

          {/* Mobile: Just create button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">New Deal</span>
            <span className="xs:hidden">New</span>
          </button>
        </div>

        {/* Mobile: Deal count below title */}
        <div className="md:hidden text-sm text-neutral-600 mb-2">
          {filteredAndSortedDeals.length} {filteredAndSortedDeals.length === 1 ? 'deal' : 'deals'}
          {hasActiveFilters && deals.length !== filteredAndSortedDeals.length && (
            <span className="text-neutral-400"> ({deals.length} total)</span>
          )}
        </div>

        {/* Description - Hide on very small screens */}
        <p className="hidden sm:block text-neutral-600 text-sm sm:text-base">
          Track your multifamily deals through the entire pipeline
        </p>
      </div>

      {/* ✨ NEW: Search and Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Bar */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Search by Address
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search address, city, or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Stage Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Filter by Stage
            </label>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Stages</option>
              {DEAL_STAGES.map(stage => (
                <option key={stage.id} value={stage.id}>
                  {stage.label.replace(/^\d+\s*-\s*/, '')}
                </option>
              ))}
            </select>
          </div>

          {/* Forecast Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Filter by Forecast
            </label>
            <select
              value={filterForecast}
              onChange={(e) => setFilterForecast(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Forecasts</option>
              {FORECAST_STATUS.map((status: { id: string; label: string }) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Controls & Clear Filters */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200 gap-3 flex-wrap sm:flex-nowrap">
          {/* ✅ MOBILE: Dropdown + Arrow (< 640px on very small, < 768px for comfort) */}
          <div className="flex sm:hidden items-center gap-2 flex-1 min-w-0">
            <Filter className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            <select
              value={sortField}
              onChange={(e) => handleSort(e.target.value as SortField)}
              className="flex-1 min-w-0 text-sm px-2 py-1.5 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="createdAt">Created</option>
              <option value="expectedCloseDate">Expected Close Date</option>
              <option value="stage">Stage</option>
              <option value="forecastStatus">Forecast</option>
            </select>
            <button
              onClick={toggleSortDirection}
              className="p-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 transition-colors flex-shrink-0"
              title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortDirection === 'asc' ? (
                <svg className="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>

          {/* ✅ DESKTOP: Button Pills (>= 640px) */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700 whitespace-nowrap">Sort by:</span>
            <button
              onClick={() => handleSort('createdAt')}
              className={`text-sm px-3 py-1 rounded-md whitespace-nowrap transition-colors ${
                sortField === 'createdAt'
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Created {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('expectedCloseDate')}
              className={`text-sm px-3 py-1 rounded-md whitespace-nowrap transition-colors ${
                sortField === 'expectedCloseDate'
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Expected Close Date {sortField === 'expectedCloseDate' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('stage')}
              className={`text-sm px-3 py-1 rounded-md whitespace-nowrap transition-colors ${
                sortField === 'stage'
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Stage {sortField === 'stage' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('forecastStatus')}
              className={`text-sm px-3 py-1 rounded-md whitespace-nowrap transition-colors ${
                sortField === 'forecastStatus'
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Forecast {sortField === 'forecastStatus' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap flex-shrink-0"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredAndSortedDeals.length === 0 ? (
        <div className="elevated-card p-12 text-center">
          <Briefcase className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-700 mb-2">
            {hasActiveFilters ? 'No deals match your filters' : 'No deals yet'}
          </h3>
          <p className="text-neutral-500 mb-6">
            {hasActiveFilters
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first deal to start tracking your pipeline'
            }
          </p>
          {hasActiveFilters ? (
            <button onClick={clearFilters} className="btn-secondary px-6 py-2">
              Clear Filters
            </button>
          ) : (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary px-6 py-3">
              <Plus className="w-5 h-5 inline mr-2" />
              Create Your First Deal
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-lg border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Deal ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Forecast Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Expected Close Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Expected Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredAndSortedDeals.map((deal) => {
                  const stageColors = getStageColors(deal.stage)
                  const stageLabel = getStageLabel(deal.stage).replace(/^\d+\s*-\s*/, '')
                  
                  return (
                    <tr key={deal.id} className="hover:bg-neutral-50">
                      {/* Deal ID - Clickable */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/dealiq/${deal.dealId}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          #{deal.dealId}
                        </Link>
                      </td>

                      {/* Address */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">
                          {deal.address}
                        </div>
                        {(deal.city || deal.state) && (
                          <div className="text-sm text-neutral-500">
                            {deal.city}{deal.city && deal.state ? ', ' : ''}{deal.state}
                          </div>
                        )}
                      </td>

                      {/* Stage - ✅ FIXED: Remove number prefix to match individual deal page */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageColors.bg} ${stageColors.text}`}>
                          {stageLabel}
                        </span>
                      </td>

                      {/* Opportunity Status - ✅ FIX #10: Active (0-5) or Inactive (6-7) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOpportunityStatusColors(deal.stage).bg} ${getOpportunityStatusColors(deal.stage).text}`}>
                          {getOpportunityStatusLabel(deal.stage)}
                        </span>
                      </td>

                      {/* Forecast Status - ✅ CHANGED header from "Forecast" to "Forecast Status" */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                        {getForecastLabel(deal.forecastStatus)}
                      </td>

                      {/* Expected Close Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                        {formatDate(deal.expectedCloseDate)}
                      </td>

                      {/* Expected Commission */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-success-700">
                        {deal.commissionPercent 
                          ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(deal.price * (deal.commissionPercent / 100))
                          : deal.commissionAmount
                          ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(deal.commissionAmount)
                          : '—'}
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {formatDate(deal.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setDeleteId(deal.id)}
                          className="text-error-600 hover:text-error-900 transition-colors"
                          title="Delete deal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredAndSortedDeals.map((deal) => {
              const stageColors = getStageColors(deal.stage)
              const stageLabel = getStageLabel(deal.stage).replace(/^\d+\s*-\s*/, '')
              
              return (
                <div key={deal.id} className="elevated-card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Link
                      href={`/dashboard/dealiq/${deal.dealId}`}
                      className="text-primary-600 hover:text-primary-700 font-semibold text-lg"
                    >
                      #{deal.dealId}
                    </Link>
                    <button
                      onClick={() => setDeleteId(deal.id)}
                      className="text-error-600 hover:text-error-900 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="text-sm font-medium text-neutral-900">{deal.address}</div>
                      {(deal.city || deal.state) && (
                        <div className="text-sm text-neutral-500">
                          {deal.city}{deal.city && deal.state ? ', ' : ''}{deal.state}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageColors.bg} ${stageColors.text}`}>
                        {stageLabel}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOpportunityStatusColors(deal.stage).bg} ${getOpportunityStatusColors(deal.stage).text}`}>
                        {getOpportunityStatusLabel(deal.stage)}
                      </span>
                      <span className="text-xs text-neutral-600">
                        {getForecastLabel(deal.forecastStatus)}
                      </span>
                    </div>

                    <div className="text-xs text-neutral-500">
                      Close: {formatDate(deal.expectedCloseDate)}
                    </div>

                    {(deal.commissionPercent || deal.commissionAmount) && (
                      <div className="text-xs font-medium text-success-700">
                        Expected Commission: {deal.commissionPercent 
                          ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(deal.price * (deal.commissionPercent / 100))
                          : new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(deal.commissionAmount!)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-error-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-error-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Delete Deal</h3>
            </div>
            
            <p className="text-neutral-600 mb-6">
              Are you sure you want to delete this deal? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={isDeleting}
                className="px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Deal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Deal Modal */}
      <CreateDealModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadDeals}
      />
    </div>
  )
}