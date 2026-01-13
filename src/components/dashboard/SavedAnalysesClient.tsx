// Location: src/components/dashboard/SavedAnalysesClient.tsx
'use client'

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card } from '@/components'
import { FileText, Trash2, Calendar, FolderOpen, ChevronDown } from 'lucide-react'
import { formatCurrency, formatTimeAgo } from '@/lib/utils'
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/utils/storage'
import { fetchAnalyses, deleteAnalysis as deleteAnalysisAPI } from '@/lib/api/analyses'
import { Group, fetchGroups } from '@/lib/api/groups'
import { GroupSidebar } from './GroupSidebar'
import { CreateGroupModal } from './CreateGroupModal'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { GroupDropdown } from './GroupDropdown'
import { SearchBar } from './SearchBar'
import { SortDropdown, SortOption } from './SortDropdown'
import { DraftAnalysis } from '@/types'
import Link from 'next/link'

// ============================================
// MOBILE GROUP SELECTOR COMPONENT (defined first)
// ============================================

interface MobileGroupSelectorProps {
  selectedGroupId: string | null
  onGroupSelect: (groupId: string | null) => void
  totalAnalysesCount: number
  ungroupedCount: number
  onCreateGroup: () => void
  onEditGroup: (group: Group) => void
}

const MobileGroupSelector = forwardRef<any, MobileGroupSelectorProps>(
  ({ selectedGroupId, onGroupSelect, totalAnalysesCount, ungroupedCount, onCreateGroup, onEditGroup }, ref) => {
    const [groups, setGroups] = useState<Group[]>([])
    const [isOpen, setIsOpen] = useState(false)

    const loadGroups = async () => {
      try {
        const response = await fetchGroups()
        setGroups(response.groups)
      } catch (error) {
        console.error('Error loading groups:', error)
      }
    }

    useEffect(() => {
      loadGroups()
    }, [])

    useImperativeHandle(ref, () => ({
      refresh: loadGroups
    }))

    const getCurrentLabel = () => {
      if (!selectedGroupId) return `All Analyses (${totalAnalysesCount})`
      if (selectedGroupId === 'no-group') return `No Group (${ungroupedCount})`
      
      const group = groups.find(g => g.id === selectedGroupId)
      return group ? `${group.name} (${group.analysisCount || 0})` : 'Selected Group'
    }

    const handleEditClick = (e: React.MouseEvent, group: Group) => {
      e.stopPropagation() // Prevent group selection
      setIsOpen(false)
      onEditGroup(group)
    }

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FolderOpen className="w-5 h-5 text-primary-600 flex-shrink-0" />
            <span className="font-medium text-neutral-900 truncate">
              {getCurrentLabel()}
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 text-neutral-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {/* All Analyses */}
              <button
                onClick={() => {
                  onGroupSelect(null)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors ${
                  !selectedGroupId ? 'bg-primary-50' : ''
                }`}
              >
                <span className="font-medium text-neutral-900">All Analyses</span>
                <span className="text-sm text-neutral-500">{totalAnalysesCount}</span>
              </button>

              {/* No Group */}
              <button
                onClick={() => {
                  onGroupSelect('no-group')
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors ${
                  selectedGroupId === 'no-group' ? 'bg-primary-50' : ''
                }`}
              >
                <span className="font-medium text-neutral-900">No Group</span>
                <span className="text-sm text-neutral-500">{ungroupedCount}</span>
              </button>

              {/* Groups with Edit button */}
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={`flex items-center justify-between hover:bg-neutral-50 transition-colors ${
                    selectedGroupId === group.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <button
                    onClick={() => {
                      onGroupSelect(group.id)
                      setIsOpen(false)
                    }}
                    className="flex-1 flex items-center justify-between px-4 py-3 min-w-0"
                  >
                    <span className="font-medium text-neutral-900 truncate">{group.name}</span>
                    <span className="text-sm text-neutral-500 ml-2 flex-shrink-0">{group.analysisCount || 0}</span>
                  </button>
                  
                  {/* Edit button */}
                  <button
                    onClick={(e) => handleEditClick(e, group)}
                    className="px-3 py-3 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors flex-shrink-0"
                    title="Edit group"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Create New Group */}
              <button
                onClick={() => {
                  onCreateGroup()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-2 px-4 py-3 border-t border-neutral-200 text-primary-600 hover:bg-primary-50 transition-colors font-medium"
              >
                <span>+ Create New Group</span>
              </button>
            </div>
          </>
        )}
      </div>
    )
  }
)

MobileGroupSelector.displayName = 'MobileGroupSelector'

// ============================================
// MAIN COMPONENT
// ============================================

interface SavedAnalysesClientProps {
  userSubscriptionStatus: string | null
}

export function SavedAnalysesClient({ userSubscriptionStatus }: SavedAnalysesClientProps) {
  // Get userId from Clerk for user-scoped storage
  const { user } = useUser()
  const userId = user?.id
  
  const [analyses, setAnalyses] = useState<any[]>([])
  const [allAnalysesCount, setAllAnalysesCount] = useState(0)
  const [ungroupedCount, setUngroupedCount] = useState(0)
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
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [analysisToDelete, setAnalysisToDelete] = useState<{ id: string; address?: string } | null>(null)
  
  const sidebarRef = useRef<any>(null)

  // Check if user is premium (can access database)
  const isPremium = userSubscriptionStatus === 'premium' || userSubscriptionStatus === 'enterprise'

  // Debounced load function
  const loadAnalyses = useCallback(async (search: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      if (isPremium) {
        // Premium user - fetch from database with group filter, search, AND sort
        const fetchParams: any = {
          isArchived: false,
          sortBy: sortOption.sortBy,
          sortOrder: sortOption.sortOrder,
          search: search || undefined,
        }
        
        // Add group filter based on selection
        if (selectedGroupId === 'no-group') {
          fetchParams.onlyUngrouped = true
        } else if (selectedGroupId) {
          fetchParams.groupId = selectedGroupId
        }
        
        const response = await fetchAnalyses(fetchParams)
        setAnalyses(response.analyses || [])
        
        // Fetch total count and ungrouped count
        const countsParams: any = {
          isArchived: false,
          search: search || undefined,
        }
        
        if (selectedGroupId && selectedGroupId !== 'no-group') {
          // Specific group selected - fetch all counts separately
          const allResponse = await fetchAnalyses(countsParams)
          setAllAnalysesCount(allResponse.total || 0)
          
          const ungroupedResponse = await fetchAnalyses({
            ...countsParams,
            onlyUngrouped: true,
          })
          setUngroupedCount(ungroupedResponse.total || 0)
        } else if (selectedGroupId === 'no-group') {
          // "No Group" selected - fetch total count separately, use response for ungrouped count
          const allResponse = await fetchAnalyses(countsParams)
          setAllAnalysesCount(allResponse.total || 0)
          setUngroupedCount(response.total || 0)
        } else {
          // "All Analyses" selected - fetch ungrouped count separately
          setAllAnalysesCount(response.total || 0)
          
          const ungroupedResponse = await fetchAnalyses({
            ...countsParams,
            onlyUngrouped: true,
          })
          setUngroupedCount(ungroupedResponse.total || 0)
        }
      } else {
        // Free/Trial user - load from local storage
        const storedData = getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.SAVED_ANALYSES, [], userId)
        
        // Filter by search query
        let filtered = storedData
        if (search) {
          const searchLower = search.toLowerCase()
          filtered = storedData.filter(analysis => {
            const property = analysis.data?.property
            return (
              analysis.name?.toLowerCase().includes(searchLower) ||
              (property?.address && property.address.toLowerCase().includes(searchLower)) ||
              (property?.city && property.city.toLowerCase().includes(searchLower)) ||
              (property?.state && property.state.toLowerCase().includes(searchLower)) ||
              (property?.zipCode && property.zipCode.toLowerCase().includes(searchLower))
            )
          })
        }
        
        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
          const dateA = a.lastModified || 0
          const dateB = b.lastModified || 0
          return sortOption.sortOrder === 'desc' ? dateB - dateA : dateA - dateB
        })
        
        setAnalyses(sorted)
        setAllAnalysesCount(filtered.length)
      }
    } catch (err) {
      console.error('Error loading analyses:', err)
      setError('Failed to load analyses')
      setAnalyses([])
    } finally {
      setIsLoading(false)
    }
  }, [isPremium, userId, sortOption, selectedGroupId])

  // Load analyses when filters change
  useEffect(() => {
    loadAnalyses(searchQuery)
  }, [loadAnalyses, searchQuery])

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  // Handle sort change - receives SortOption not string
  const handleSortChange = (option: SortOption) => {
    setSortOption(option)
  }

  // Handle delete
  const handleDeleteClick = (id: string, address?: string) => {
    setAnalysisToDelete({ id, address })
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!analysisToDelete) return

    try {
      if (isPremium) {
        await deleteAnalysisAPI(analysisToDelete.id)
      } else {
        const storedData = getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.SAVED_ANALYSES, [], userId)
        const filtered = storedData.filter(a => a.id !== analysisToDelete.id)
        setStorageItem(STORAGE_KEYS.SAVED_ANALYSES, filtered, userId)
      }
      
      loadAnalyses(searchQuery)
      setDeleteModalOpen(false)
      setAnalysisToDelete(null)
    } catch (err) {
      console.error('Error deleting analysis:', err)
      alert('Failed to delete analysis. Please try again.')
    }
  }

  // Group management
  const handleCreateGroup = () => {
    setEditingGroup(null)
    setIsModalOpen(true)
  }

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group)
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    if (sidebarRef.current?.refresh) {
      sidebarRef.current.refresh()
    }
    loadAnalyses(searchQuery)
  }

  const handleGroupChanged = () => {
    if (sidebarRef.current?.refresh) {
      sidebarRef.current.refresh()
    }
    loadAnalyses(searchQuery)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="elevated-card p-8 text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-neutral-800 mb-3">Error Loading Analyses</h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button onClick={() => loadAnalyses(searchQuery)} className="btn-primary px-6 py-3">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex h-full overflow-hidden">
        {/* Desktop: Group Sidebar (hidden on mobile) */}
        {isPremium && (
          <div className="hidden lg:block">
            <GroupSidebar
              ref={sidebarRef}
              selectedGroupId={selectedGroupId}
              onGroupSelect={setSelectedGroupId}
              totalAnalysesCount={allAnalysesCount}
              ungroupedCount={ungroupedCount}
              searchQuery={searchQuery}
              onCreateGroup={handleCreateGroup}
              onEditGroup={handleEditGroup}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto h-full">
          {/* Mobile: Group Dropdown + Search + Sort (stacked) */}
          <div className="p-4 md:p-6 pb-2">
            <div className="space-y-3">
              {/* Mobile Group Dropdown (only on mobile, only if premium) */}
              {isPremium && (
                <div className="lg:hidden">
                  <MobileGroupSelector
                    ref={sidebarRef}
                    selectedGroupId={selectedGroupId}
                    onGroupSelect={setSelectedGroupId}
                    totalAnalysesCount={allAnalysesCount}
                    ungroupedCount={ungroupedCount}
                    onCreateGroup={handleCreateGroup}
                    onEditGroup={handleEditGroup}
                  />
                </div>
              )}

              {/* Search and Sort - Stacked on mobile, side-by-side on desktop */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Search Bar */}
                <div className="w-full lg:flex-1 lg:min-w-0 lg:max-w-2xl">
                  <SearchBar 
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search by name, address, city, or zip..."
                  />
                </div>
                
                {/* Sort Dropdown */}
                <div className="w-full lg:w-auto lg:flex-shrink-0">
                  <SortDropdown 
                    value={sortOption.value}
                    onChange={handleSortChange}
                  />
                </div>
              </div>
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
                      address: analysis.address || undefined,
                      city: analysis.city || undefined,
                      state: analysis.state || undefined,
                      zipCode: analysis.zipCode || undefined,
                      totalUnits: analysis.totalUnits || 0,
                      purchasePrice: analysis.purchasePrice || 0,
                    }
                    
                    const results = analysis.results
                    if (!property) return null
                    
                    const capRate = (analysis.capRate || results?.keyMetrics?.capRate || 0)
                    const cashOnCashReturn = (analysis.cashOnCashReturn || results?.keyMetrics?.cashOnCashReturn || 0)
                    const annualCashFlow = (analysis.cashFlow || results?.keyMetrics?.annualCashFlow || 0)
                    
                    // Use updatedAt to show when analysis was last modified, fallback to createdAt
                    const savedDate = analysis.updatedAt 
                      ? new Date(analysis.updatedAt).getTime()
                      : analysis.createdAt 
                        ? new Date(analysis.createdAt).getTime()
                        : analysis.lastModified || Date.now()
                    
                    return (
                      <Card key={analysis.id} className="p-4 md:p-6 hover:shadow-lg transition-shadow">
                        <div className="flex flex-col lg:flex-row items-start gap-4">
                          <div className="flex-1 w-full min-w-0">
                            {/* Title */}
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
                              <h3 className="text-lg font-semibold text-neutral-900 truncate flex-1 min-w-0">
                                {analysis.name}
                              </h3>
                              
                              {/* Desktop: Group dropdown on same line as title */}
                              {isPremium && (
                                <div className="hidden lg:block">
                                  <GroupDropdown
                                    analysisId={analysis.id}
                                    currentGroupId={analysis.groupId || null}
                                    currentGroupName={analysis.group?.name}
                                    onGroupChanged={handleGroupChanged}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Mobile: Group dropdown BEFORE address */}
                            {isPremium && (
                              <div className="lg:hidden mb-2">
                                <GroupDropdown
                                  analysisId={analysis.id}
                                  currentGroupId={analysis.groupId || null}
                                  currentGroupName={analysis.group?.name}
                                  onGroupChanged={handleGroupChanged}
                                />
                              </div>
                            )}
                            
                            {/* Property details */}
                            <div className="text-sm text-neutral-600 space-y-1 mb-4">
                              {property.address && (
                                <p className="break-words">📍 {property.address}{property.city ? `, ${property.city}` : ''}{property.state ? `, ${property.state}` : ''}{property.zipCode ? ` ${property.zipCode}` : ''}</p>
                              )}
                              <p>🏢 {property.totalUnits || 0} units • {formatCurrency(property.purchasePrice || 0)}</p>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span>Updated {formatTimeAgo(savedDate)}</span>
                              </div>
                            </div>

                            {/* Metrics */}
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

                          {/* Action buttons */}
                          <div className="flex lg:flex-col gap-2 w-full lg:w-auto">
                            <Link
                              href={`/dashboard?analysisId=${analysis.id}`}
                              className="btn-primary px-4 py-2 text-sm whitespace-nowrap flex-1 lg:flex-initial text-center"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(
                                analysis.id, 
                                property.address || (property.city || property.state ? `${property.city || ''}${property.city && property.state ? ', ' : ''}${property.state || ''}` : 'Unknown Location')
                              )}
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
      
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setAnalysisToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        propertyAddress={analysisToDelete?.address}
      />
    </>
  )
}