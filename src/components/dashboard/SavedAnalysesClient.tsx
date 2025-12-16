// src/components/dashboard/SavedAnalysesClient.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/components'
import { FileText, Trash2, Calendar } from 'lucide-react'
import { formatCurrency, formatTimeAgo, getStorageItem, STORAGE_KEYS } from '@/lib/utils'
import { fetchAnalyses, deleteAnalysis as deleteAnalysisAPI } from '@/lib/api/analyses'
import { Group } from '@/lib/api/groups'
import { GroupSidebar } from './GroupSidebar'
import { CreateGroupModal } from './CreateGroupModal'
import { GroupDropdown } from './GroupDropdown'
import { SearchBar } from './SearchBar'
import { SortDropdown, SortOption } from './SortDropdown'
import { DraftAnalysis } from '@/types'
import Link from 'next/link'

interface SavedAnalysesClientProps {
  userSubscriptionStatus: string | null
}

export function SavedAnalysesClient({ userSubscriptionStatus }: SavedAnalysesClientProps) {
  const [analyses, setAnalyses] = useState<any[]>([])
  const [allAnalysesCount, setAllAnalysesCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>({
    value: 'newest',
    label: 'Newest First',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  
  const sidebarRef = useRef<any>(null)
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Check if user is premium (can access database)
  const isPremium = userSubscriptionStatus === 'premium' || userSubscriptionStatus === 'enterprise'

  // Debounced load function
  const loadAnalyses = useCallback(async (search: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      if (isPremium) {
        // Premium user - fetch from database with group filter, search, AND sort
        const response = await fetchAnalyses({
          isArchived: false,
          sortBy: sortOption.sortBy,
          sortOrder: sortOption.sortOrder,
          groupId: selectedGroupId || undefined,
          search: search || undefined,
        })
        setAnalyses(response.analyses || [])
        
        // Also fetch total count for "All Analyses" display
        if (selectedGroupId) {
          const allResponse = await fetchAnalyses({
            isArchived: false,
            search: search || undefined,
          })
          setAllAnalysesCount(allResponse.total || 0)
        } else {
          setAllAnalysesCount(response.total || 0)
        }
      } else {
        // Trial/Free user - load from localStorage and filter locally
        const savedAnalyses = getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.DRAFTS, [])
        let completedAnalyses = savedAnalyses.filter(analysis => analysis.results)
        
        // Apply local search filter
        if (search) {
          const query = search.toLowerCase()
          completedAnalyses = completedAnalyses.filter(analysis => 
            analysis.name?.toLowerCase().includes(query) ||
            analysis.data?.property?.address?.toLowerCase().includes(query) ||
            analysis.data?.property?.city?.toLowerCase().includes(query) ||
            analysis.data?.property?.state?.toLowerCase().includes(query) ||
            analysis.data?.property?.zipCode?.toLowerCase().includes(query)
          )
        }
        
        // Apply local sort - with proper null handling
        completedAnalyses.sort((a, b) => {
          const aValue = (a as any)[sortOption.sortBy]
          const bValue = (b as any)[sortOption.sortBy]
          
          // Handle undefined/null values
          if (aValue === undefined || aValue === null) return 1
          if (bValue === undefined || bValue === null) return -1
          
          // Compare values
          if (sortOption.sortOrder === 'asc') {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
          } else {
            return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
          }
        })
        
        setAnalyses(completedAnalyses)
        setAllAnalysesCount(completedAnalyses.length)
      }
    } catch (err: any) {
      console.error('Error loading analyses:', err)
      setError(err.message || 'Failed to load analyses')
    } finally {
      setIsLoading(false)
    }
  }, [isPremium, selectedGroupId, sortOption])

  // Initial load and when group or sort changes
  useEffect(() => {
    loadAnalyses(searchQuery)
  }, [isPremium, selectedGroupId, sortOption])

  // Debounce search input
  useEffect(() => {
    // Clear existing timer
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    // Set new timer for debounced search
    searchDebounceRef.current = setTimeout(() => {
      loadAnalyses(searchQuery)
    }, 500)

    // Cleanup
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [searchQuery, loadAnalyses])

  const handleDelete = async (analysisId: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) {
      return
    }

    try {
      if (isPremium) {
        // Premium user - delete from database
        await deleteAnalysisAPI(analysisId)
        setAnalyses(prev => prev.filter(a => a.id !== analysisId))
        // Refresh to update counts
        loadAnalyses(searchQuery)
        // Refresh sidebar to update group counts
        if (sidebarRef.current?.refreshGroups) {
          sidebarRef.current.refreshGroups()
        }
      } else {
        // Trial/Free user - delete from localStorage
        const savedAnalyses = getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.DRAFTS, [])
        const updatedAnalyses = savedAnalyses.filter(a => a.id !== analysisId)
        localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(updatedAnalyses))
        setAnalyses(updatedAnalyses.filter(analysis => analysis.results))
      }
    } catch (error) {
      console.error('Error deleting analysis:', error)
      alert('Failed to delete analysis. Please try again.')
    }
  }

  const handleCreateGroup = () => {
    setEditingGroup(null)
    setIsModalOpen(true)
  }

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group)
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    // Refresh groups in sidebar
    if (sidebarRef.current?.refreshGroups) {
      sidebarRef.current.refreshGroups()
    }
    // Reload analyses to update group badges
    loadAnalyses(searchQuery)
  }

  const handleGroupChanged = () => {
    // Refresh analyses to show updated group
    loadAnalyses(searchQuery)
    // Refresh sidebar to update group counts
    if (sidebarRef.current?.refreshGroups) {
      sidebarRef.current.refreshGroups()
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleSortChange = (option: SortOption) => {
    setSortOption(option)
  }

  if (isLoading && !analyses.length) {
    return (
      <div className="elevated-card p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-neutral-600">Loading your analyses...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="elevated-card p-12 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-semibold text-neutral-800 mb-3">
          Error Loading Analyses
        </h2>
        <p className="text-neutral-600 mb-6">{error}</p>
        <button onClick={() => loadAnalyses(searchQuery)} className="btn-primary px-6 py-3">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex h-full">
        {/* Group Sidebar */}
        {isPremium && (
          <GroupSidebar
            ref={sidebarRef}
            selectedGroupId={selectedGroupId}
            onGroupSelect={setSelectedGroupId}
            totalAnalysesCount={allAnalysesCount}
            onCreateGroup={handleCreateGroup}
            onEditGroup={handleEditGroup}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto h-full">
          {/* Search Bar - Always visible at top */}
          <div className="p-4 md:p-6 pb-2">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search Bar */}
              <div className="flex-1">
                <SearchBar 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name, address, city, or zip..."
                />
              </div>
              
              {/* Sort Dropdown */}
              <SortDropdown 
                value={sortOption.value}
                onChange={handleSortChange}
              />
            </div>
          </div>

          {/* Content Area */}
          {analyses.length === 0 && !searchQuery ? (
            <div className="p-6 md:p-12 flex items-center justify-center">
              <div className="elevated-card p-8 md:p-12 text-center max-w-2xl">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-3">
                  {selectedGroupId ? 'No Analyses in This Group' : 'No Saved Analyses Yet'}
                </h2>
                <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                  {selectedGroupId
                    ? 'This group is empty. Create an analysis and assign it to this group.'
                    : 'Complete a property analysis to save it here. All your completed analyses will appear in this list.'
                  }
                </p>
                <Link href="/dashboard" className="btn-primary px-8 py-3 inline-block">
                  Analyze a Property
                </Link>
              </div>
            </div>
          ) : (
            <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-4">
              {/* Analysis count */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-neutral-600">
                  {isLoading && <span className="text-neutral-400">Loading... </span>}
                  {analyses.length} {analyses.length === 1 ? 'analysis' : 'analyses'}
                  {selectedGroupId && ' in this group'}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>

              {/* Empty search results */}
              {analyses.length === 0 && searchQuery && (
                <div className="elevated-card p-12 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-2xl font-semibold text-neutral-800 mb-3">
                    No Results Found
                  </h2>
                  <p className="text-neutral-600 mb-6">
                    No analyses match "{searchQuery}"
                    {selectedGroupId && ' in this group'}
                  </p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="btn-secondary px-6 py-3"
                  >
                    Clear Search
                  </button>
                </div>
              )}

              {/* Analyses Grid */}
              {analyses.length > 0 && (
                <div className="grid gap-4">
                  {analyses.map((analysis) => {
                    const property = analysis.data?.property || {
                      address: analysis.address,
                      city: analysis.city,
                      state: analysis.state,
                      zipCode: analysis.zipCode,
                      totalUnits: analysis.totalUnits,
                      purchasePrice: analysis.purchasePrice,
                    }
                    
                    const results = analysis.results
                    if (!property) return null
                    
                    const capRate = (analysis.capRate || results?.keyMetrics?.capRate || 0)
                    const cashOnCashReturn = (analysis.cashOnCashReturn || results?.keyMetrics?.cashOnCashReturn || 0)
                    const annualCashFlow = (analysis.cashFlow || results?.keyMetrics?.annualCashFlow || 0)
                    
                    const savedDate = analysis.createdAt 
                      ? new Date(analysis.createdAt).getTime()
                      : analysis.lastModified || Date.now()
                    
                    return (
                      <Card key={analysis.id} className="p-4 md:p-6 hover:shadow-lg transition-shadow">
                        <div className="flex flex-col lg:flex-row items-start gap-4">
                          <div className="flex-1 w-full min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
                              <h3 className="text-lg font-semibold text-neutral-900 truncate flex-1 min-w-0">
                                {analysis.name}
                              </h3>
                              
                              {isPremium && (
                                <GroupDropdown
                                  analysisId={analysis.id}
                                  currentGroupId={analysis.groupId || null}
                                  currentGroupName={analysis.group?.name}
                                  onGroupChanged={handleGroupChanged}
                                />
                              )}
                            </div>
                            
                            <div className="text-sm text-neutral-600 space-y-1 mb-4">
                              {property.address && (
                                <p className="break-words">📍 {property.address}, {property.city}, {property.state} {property.zipCode}</p>
                              )}
                              <p>🏢 {property.totalUnits} units • {formatCurrency(property.purchasePrice || 0)}</p>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span>Saved {formatTimeAgo(savedDate)}</span>
                              </div>
                            </div>

                            {results && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-primary-50 rounded-lg p-3">
                                  <div className="text-xs text-primary-600 mb-1">Cap Rate</div>
                                  <div className="text-base md:text-lg font-bold text-primary-700 break-words">
                                    {(capRate * 100).toFixed(2)}%
                                  </div>
                                </div>
                                <div className="bg-success-50 rounded-lg p-3">
                                  <div className="text-xs text-success-600 mb-1">Annual Cash Flow</div>
                                  <div className="text-base md:text-lg font-bold text-success-700 break-words">
                                    {formatCurrency(annualCashFlow)}
                                  </div>
                                </div>
                                <div className="bg-secondary-50 rounded-lg p-3">
                                  <div className="text-xs text-secondary-600 mb-1">CoC Return</div>
                                  <div className="text-base md:text-lg font-bold text-secondary-700 break-words">
                                    {(cashOnCashReturn * 100).toFixed(2)}%
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex lg:flex-col gap-2 w-full lg:w-auto">
                            <Link
                              href={`/dashboard?analysisId=${analysis.id}`}
                              className="btn-primary px-4 py-2 text-sm whitespace-nowrap flex-1 lg:flex-initial text-center"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => handleDelete(analysis.id)}
                              className="btn-secondary px-4 py-2 text-sm flex items-center justify-center gap-2 whitespace-nowrap text-error-600 hover:bg-error-50 flex-1 lg:flex-initial"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CreateGroupModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingGroup(null)
        }}
        onSuccess={handleModalSuccess}
        editGroup={editingGroup}
      />
    </>
  )
}