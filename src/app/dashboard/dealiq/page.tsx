// FILE LOCATION: /src/app/dashboard/dealiq/page.tsx
// FIX #2: Multi-Select Filters for Stage and Forecast Status (CORRECTED LOGIC)
// FIXED: Default state = no boxes checked = show all deals
// REVAMPED: Added search, sort/filters, fixed stage pills to match individual deal page
// BATCH E ITEM #4: Added route protection for DealIQ feature toggle

'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, Plus, Trash2, AlertTriangle, Search, Filter, Lock, ChevronDown, X } from 'lucide-react'
import Link from 'next/link'
import { getStageLabel, getStageColors, getForecastLabel, DEAL_STAGES, FORECAST_STATUS, getOpportunityStatusLabel, getOpportunityStatusColors, getOpportunityStatus } from '@/lib/dealiq-constants'
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

type SortField = 'address' | 'stage' | 'forecastStatus' | 'expectedCloseDate' | 'createdAt' | 'commission'
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

  // ✨ SEARCH AND SORT STATE
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // 🎯 FIX #2: MULTI-SELECT FILTER STATE (CORRECTED LOGIC)
  // Empty array = "No filter" = Show ALL deals (default state)
  // Has items = "Filter active" = Show ONLY selected items
  const [filterStages, setFilterStages] = useState<string[]>([]) // Empty = show all
  const [filterForecasts, setFilterForecasts] = useState<string[]>([]) // Empty = show all
  const [filterStatus, setFilterStatus] = useState<string>('all') // Keep single-select for active/inactive

  // 🎯 DROPDOWN STATE - Track which filter dropdowns are open
  const [showStageDropdown, setShowStageDropdown] = useState(false)
  const [showForecastDropdown, setShowForecastDropdown] = useState(false)
  
  // Refs for click-outside detection
  const stageDropdownRef = useRef<HTMLDivElement>(null)
  const forecastDropdownRef = useRef<HTMLDivElement>(null)

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
          
          // Check if user can access DealIQ (premium, enterprise, or team member)
          const isPremium = data.subscriptionStatus === 'premium' || data.subscriptionStatus === 'enterprise' || data.isTeamMember
          
          // Check if can start trial
          const isFree = data.subscriptionStatus === 'free'
          setCanStartTrial(isFree && !data.hasUsedTrial && !data.isTeamMember)
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

  // 🎯 CLICK OUTSIDE HANDLER - Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(event.target as Node)) {
        setShowStageDropdown(false)
      }
      if (forecastDropdownRef.current && !forecastDropdownRef.current.contains(event.target as Node)) {
        setShowForecastDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  // 🎯 FIX #2: MULTI-SELECT HELPER FUNCTIONS (CORRECTED LOGIC)

  /**
   * Toggle a stage in the filter array
   * If stage is selected, remove it. If not selected, add it.
   */
  const toggleStageFilter = (stageId: string) => {
    setFilterStages(prev => {
      if (prev.includes(stageId)) {
        // Remove the stage (uncheck)
        return prev.filter(id => id !== stageId)
      } else {
        // Add the stage (check)
        return [...prev, stageId]
      }
    })
  }

  /**
   * Toggle a forecast in the filter array
   */
  const toggleForecastFilter = (forecastId: string) => {
    setFilterForecasts(prev => {
      if (prev.includes(forecastId)) {
        return prev.filter(id => id !== forecastId)
      } else {
        return [...prev, forecastId]
      }
    })
  }

  /**
   * Clear all stage selections (back to default = show all)
   */
  const clearStageFilters = () => {
    setFilterStages([])
  }

  /**
   * Clear all forecast selections (back to default = show all)
   */
  const clearForecastFilters = () => {
    setFilterForecasts([])
  }

  // ✨ FILTER AND SORT DEALS (CORRECTED LOGIC)
  const filteredAndSortedDeals = useMemo(() => {
    let filtered = [...deals]

    // Filter by search query (address, city, state)
    if (searchQuery.trim()) {
      filtered = filtered.filter(deal => 
        deal.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deal.city && deal.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (deal.state && deal.state.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // 🎯 CORRECTED: MULTI-SELECT STAGE FILTER
    // Empty array = show ALL (no filter)
    // Has items = show ONLY those stages
    if (filterStages.length > 0) {
      filtered = filtered.filter(deal => filterStages.includes(deal.stage))
    }

    // 🎯 CORRECTED: MULTI-SELECT FORECAST FILTER
    // Empty array = show ALL (no filter)
    // Has items = show ONLY those forecasts
    if (filterForecasts.length > 0) {
      filtered = filtered.filter(deal => filterForecasts.includes(deal.forecastStatus))
    }

    // Filter by opportunity status (active/inactive) - Keep single-select
    if (filterStatus !== 'all') {
      filtered = filtered.filter(deal => {
        const status = getOpportunityStatus(deal.stage)
        return status === filterStatus
      })
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
        case 'commission':
          // Calculate commission for each deal
          const commissionA = a.commissionPercent 
            ? a.price * (a.commissionPercent / 100)
            : a.commissionAmount || 0
          const commissionB = b.commissionPercent 
            ? b.price * (b.commissionPercent / 100)
            : b.commissionAmount || 0
          comparison = commissionA - commissionB
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [deals, searchQuery, filterStages, filterForecasts, filterStatus, sortField, sortDirection])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // 🎯 CLEAR ALL FILTERS FUNCTION
  const clearAllFilters = () => {
    setSearchQuery('')
    setFilterStages([])
    setFilterForecasts([])
    setFilterStatus('all')
  }

  // 🎯 COUNT ACTIVE FILTERS (for UI badge)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filterStages.length > 0) count++
    if (filterForecasts.length > 0) count++
    if (filterStatus !== 'all') count++
    return count
  }, [filterStages, filterForecasts, filterStatus])

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      {/* Header with conditional lock */}
      <LockedFeatureWrapper
        isLocked={canAccessDealIQ === false}
        featureName="DealIQ"
        canStartTrial={canStartTrial}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">DealIQ</h1>
              <p className="text-sm text-neutral-600">Manage your commercial real estate pipeline</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            disabled={canAccessDealIQ === false}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            New Deal
          </button>
        </div>

        {/* Search, Filters, and Sort Controls */}
        <div className="elevated-card p-4 mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by address, city, or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {/* 🎯 MULTI-SELECT STAGE FILTER (CORRECTED) */}
            <div className="relative" ref={stageDropdownRef}>
              <button
                onClick={() => setShowStageDropdown(!showStageDropdown)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 transition-colors flex items-center justify-between"
              >
                <span className="text-sm text-neutral-700">
                  Stage {filterStages.length > 0 && `(${filterStages.length})`}
                </span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showStageDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showStageDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  {/* Header with Clear button only */}
                  <div className="sticky top-0 bg-white border-b border-neutral-200 p-2 flex justify-between items-center">
                    <span className="text-xs font-medium text-neutral-600">
                      {filterStages.length === 0 ? 'All Stages' : `${filterStages.length} Selected`}
                    </span>
                    <button
                      onClick={clearStageFilters}
                      disabled={filterStages.length === 0}
                      className="text-xs text-neutral-600 hover:text-neutral-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Checkbox Options (CORRECTED LOGIC) */}
                  <div className="p-2">
                    {DEAL_STAGES.map((stage) => {
                      // ✅ CORRECTED: Only checked if explicitly in the array
                      const isSelected = filterStages.includes(stage.id)
                      const colors = getStageColors(stage.id)
                      
                      return (
                        <label
                          key={stage.id}
                          className="flex items-center gap-3 px-2 py-2 hover:bg-neutral-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStageFilter(stage.id)}
                            className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                            {stage.label}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 🎯 MULTI-SELECT FORECAST FILTER (CORRECTED) */}
            <div className="relative" ref={forecastDropdownRef}>
              <button
                onClick={() => setShowForecastDropdown(!showForecastDropdown)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 transition-colors flex items-center justify-between"
              >
                <span className="text-sm text-neutral-700">
                  Forecast {filterForecasts.length > 0 && `(${filterForecasts.length})`}
                </span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showForecastDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showForecastDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
                  {/* Header with Clear button only */}
                  <div className="sticky top-0 bg-white border-b border-neutral-200 p-2 flex justify-between items-center">
                    <span className="text-xs font-medium text-neutral-600">
                      {filterForecasts.length === 0 ? 'All Forecasts' : `${filterForecasts.length} Selected`}
                    </span>
                    <button
                      onClick={clearForecastFilters}
                      disabled={filterForecasts.length === 0}
                      className="text-xs text-neutral-600 hover:text-neutral-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Checkbox Options (CORRECTED LOGIC) */}
                  <div className="p-2">
                    {FORECAST_STATUS.map((forecast) => {
                      // ✅ CORRECTED: Only checked if explicitly in the array
                      const isSelected = filterForecasts.includes(forecast.id)
                      
                      return (
                        <label
                          key={forecast.id}
                          className="flex items-center gap-3 px-2 py-2 hover:bg-neutral-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleForecastFilter(forecast.id)}
                            className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-neutral-700">{forecast.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* OPPORTUNITY STATUS FILTER (Keep single-select) */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="all">Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* CLEAR FILTERS BUTTON */}
            <div>
              <button
                onClick={clearAllFilters}
                disabled={searchQuery === '' && filterStages.length === 0 && filterForecasts.length === 0 && filterStatus === 'all'}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <X className="w-4 h-4" />
                Clear Filters
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary-600 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Sort Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-2 flex-wrap">
            <span className="text-sm text-neutral-600 mr-2">Sort by:</span>
            
            <button
              onClick={() => toggleSort('createdAt')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortField === 'createdAt'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Created {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>

            <button
              onClick={() => toggleSort('expectedCloseDate')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortField === 'expectedCloseDate'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Expected Close Date {sortField === 'expectedCloseDate' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>

            <button
              onClick={() => toggleSort('commission')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortField === 'commission'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Expected Commission {sortField === 'commission' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>

            <button
              onClick={() => toggleSort('stage')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortField === 'stage'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Stage {sortField === 'stage' && (sortDirection === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          {/* Sort Dropdown (Mobile) */}
          <div className="md:hidden">
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-') as [SortField, SortDirection]
                setSortField(field)
                setSortDirection(direction)
              }}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="createdAt-desc">Created (Newest First)</option>
              <option value="createdAt-asc">Created (Oldest First)</option>
              <option value="expectedCloseDate-desc">Expected Close Date (Latest First)</option>
              <option value="expectedCloseDate-asc">Expected Close Date (Earliest First)</option>
              <option value="commission-desc">Exp. Commission (Highest First)</option>
              <option value="commission-asc">Exp. Commission (Lowest First)</option>
              <option value="stage-asc">Stage (Low to High)</option>
              <option value="stage-desc">Stage (High to Low)</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-neutral-600">
            Showing <span className="font-semibold text-neutral-900">{filteredAndSortedDeals.length}</span> of <span className="font-semibold text-neutral-900">{deals.length}</span> deals
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="elevated-card p-12 text-center">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading deals...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="elevated-card p-6 border-l-4 border-error-500">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-error-600" />
              <div>
                <h3 className="font-semibold text-neutral-900">Error</h3>
                <p className="text-sm text-neutral-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && deals.length === 0 && (
          <div className="elevated-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No deals yet</h3>
            <p className="text-neutral-600 mb-6">Get started by creating your first deal</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create First Deal
            </button>
          </div>
        )}

        {/* No Results After Filtering */}
        {!isLoading && !error && deals.length > 0 && filteredAndSortedDeals.length === 0 && (
          <div className="elevated-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No matching deals</h3>
            <p className="text-neutral-600 mb-6">Try adjusting your filters or search query</p>
            <button
              onClick={clearAllFilters}
              className="btn-secondary"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Deals Table/Cards */}
        {!isLoading && !error && filteredAndSortedDeals.length > 0 && (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Deal ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Forecast Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Expected Close Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Expected Commission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {filteredAndSortedDeals.map((deal) => {
                    const stageColors = getStageColors(deal.stage)
                    const stageLabel = getStageLabel(deal.stage).replace(/^\d+\s*-\s*/, '')
                    
                    return (
                      <tr key={deal.id} className="hover:bg-neutral-50 transition-colors">
                        {/* Deal ID */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/dashboard/dealiq/${deal.dealId}`}
                            className="text-primary-600 hover:text-primary-700 font-semibold"
                          >
                            #{deal.dealId}
                          </Link>
                        </td>

                        {/* Property Address */}
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-neutral-900">
                            {deal.address}
                          </div>
                          {(deal.city || deal.state) && (
                            <div className="text-sm text-neutral-500">
                              {deal.city}{deal.city && deal.state ? ', ' : ''}{deal.state}
                            </div>
                          )}
                        </td>

                        {/* Stage */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageColors.bg} ${stageColors.text}`}>
                            {stageLabel}
                          </span>
                        </td>

                        {/* Opportunity Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOpportunityStatusColors(deal.stage).bg} ${getOpportunityStatusColors(deal.stage).text}`}>
                            {getOpportunityStatusLabel(deal.stage)}
                          </span>
                        </td>

                        {/* Forecast Status */}
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
      </LockedFeatureWrapper>
    </div>
  )
}