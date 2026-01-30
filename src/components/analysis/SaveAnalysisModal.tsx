// FILE LOCATION: /src/components/analysis/SaveAnalysisModal.tsx
// FIXED: Shows "Link to Deal" when coming from a deal, "Create Deal" otherwise

'use client'

import { useState, useEffect } from 'react'
import { Button, Card } from '@/components'
import { X, AlertCircle, Briefcase, Link as LinkIcon } from 'lucide-react'
import { fetchAnalyses } from '@/lib/api/analyses'
import { Group, fetchGroups } from '@/lib/api/groups'
import { useSystemSettings } from '@/hooks/useSystemSettings'

interface SaveAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (options: SaveOptions) => void
  propertyAddress: string
  isPremium: boolean
  linkedDealId?: string | null  // ✅ Just the MongoDB ID
}

export interface SaveOptions {
  propertyName: string
  groupId: string | null
  overrideExisting: boolean
  existingAnalysisId?: string
  createDeal: boolean
  linkedDealId?: string | null  // ✅ Just the MongoDB ID
}

export function SaveAnalysisModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  propertyAddress,
  isPremium,
  linkedDealId = null  // ✅ Just the MongoDB ID
}: SaveAnalysisModalProps) {
  const [propertyName, setPropertyName] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [existingAnalysis, setExistingAnalysis] = useState<any | null>(null)
  const [overrideExisting, setOverrideExisting] = useState(false)
  
  // ✅ NEW: Duplicate deal detection
  const [existingDeal, setExistingDeal] = useState<any | null>(null)
  const [createDealAnyway, setCreateDealAnyway] = useState(false)
  
  // ✅ Default to TRUE if we have a linkedDealId
  const [createDeal, setCreateDeal] = useState(!!linkedDealId)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { settings: systemSettings } = useSystemSettings()

  // Load groups and check for existing analysis when modal opens
  useEffect(() => {
    if (isOpen && isPremium) {
      loadData()
    }
  }, [isOpen, isPremium, propertyAddress])
  
  // ✅ Reset createDeal when linkedDealId changes
  useEffect(() => {
    setCreateDeal(!!linkedDealId)
  }, [linkedDealId])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load groups
      const groupsData = await fetchGroups()
      setGroups(groupsData.groups)

      // Check if analysis with this address already exists
      const analysesResponse = await fetchAnalyses({
        search: propertyAddress,
        isArchived: false
      })

      // Find exact address match
      const existing = analysesResponse.analyses.find(
        (a: any) => a.data?.property?.address?.toLowerCase() === propertyAddress.toLowerCase()
      )

      if (existing) {
        setExistingAnalysis(existing)
        setPropertyName(existing.name || propertyAddress)
      } else {
        setPropertyName(propertyAddress)
      }

      // ✅ NEW: Check for existing deal with same address
      if (!linkedDealId) {  // Only check if not already linked to a deal
        try {
          const dealsResponse = await fetch('/api/dealiq')
          if (dealsResponse.ok) {
            const dealsData = await dealsResponse.json()
            const existingDealMatch = dealsData.deals.find((d: any) => 
              d.address?.toLowerCase().trim() === propertyAddress.toLowerCase().trim()
            )
            if (existingDealMatch) {
              setExistingDeal(existingDealMatch)
              setCreateDealAnyway(false)  // Default to NOT creating duplicate
            }
          }
        } catch (dealErr) {
          console.error('Error checking for duplicate deals:', dealErr)
          // Don't fail the whole modal if deal check fails
        }
      }

    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load groups')
      setPropertyName(propertyAddress)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!propertyName.trim()) {
      setError('Please enter a property name')
      return
    }

    // ✅ NEW: If duplicate deal exists and user chose "View Existing", redirect instead
    if (createDeal && existingDeal && !createDealAnyway && !linkedDealId) {
      // User wants to view existing deal instead of creating new
      // Clear draft-related storage (but not auth/preferences)
      try {
        // Clear specific draft-related localStorage keys
        const draftKeys = Object.keys(localStorage).filter(key => 
          key.includes('draft') || 
          key.includes('analysis') || 
          key.startsWith('property_analysis') ||
          key.includes('saved_analysis')
        )
        draftKeys.forEach(key => {
          localStorage.removeItem(key)
          console.log('🧹 Removed localStorage key:', key)
        })
        
        // Clear all sessionStorage (safe to clear everything)
        sessionStorage.clear()
        
        console.log('✅ Cleared draft storage before navigating to deal')
      } catch (e) {
        console.error('Error clearing storage:', e)
      }
      
      // Navigate to deal in SAME tab (abandons current analysis)
      window.location.href = `/dashboard/dealiq?deal=${existingDeal.dealId}`
      return
    }

    onConfirm({
      propertyName: propertyName.trim(),
      groupId: selectedGroupId,
      overrideExisting: existingAnalysis ? overrideExisting : false,
      existingAnalysisId: existingAnalysis?.id,
      createDeal: createDeal && (!existingDeal || createDealAnyway || !!linkedDealId),  // ✅ Convert to boolean with !!
      linkedDealId
    })
  }

  if (!isOpen) return null

  // Check if DealIQ is enabled
  const isDealIQEnabled = isPremium && systemSettings?.dealiqEnabled

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-lg mx-4 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">
              Save Analysis
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Configure save options before calculating results
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-8 text-center text-neutral-600">
            Loading...
          </div>
        ) : (
          <>
            {/* Property Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Property Name <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter property name"
              />
            </div>

            {/* Group Selection (Premium Only) */}
            {isPremium && groups.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Group (Optional)
                </label>
                <select
                  value={selectedGroupId || ''}
                  onChange={(e) => setSelectedGroupId(e.target.value || null)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">No Group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ========================================= */}
            {/* DEALIQ CHECKBOX - DYNAMIC TEXT */}
            {/* ========================================= */}
            {isDealIQEnabled && (
              <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createDeal}
                    onChange={(e) => setCreateDeal(e.target.checked)}
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {linkedDealId ? (
                        <>
                          <LinkIcon className="w-4 h-4 text-primary-600" />
                          <span className="font-medium text-primary-900">
                            Link to Deal #{linkedDealId}
                          </span>
                        </>
                      ) : (
                        <>
                          <Briefcase className="w-4 h-4 text-primary-600" />
                          <span className="font-medium text-primary-900">
                            Create Deal in DealIQ
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-primary-700">
                      {linkedDealId 
                        ? `Link this analysis back to Deal #${linkedDealId} for easy tracking`
                        : 'Create a new deal in your CRM pipeline to track this property through acquisition'
                      }
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* ✅ NEW: Duplicate Deal Warning */}
            {createDeal && existingDeal && !linkedDealId && (
              <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-warning-900 mb-1">
                      Deal Already Exists
                    </h3>
                    <p className="text-sm text-warning-800 mb-3">
                      A deal for "{existingDeal.address}" already exists in your pipeline{' '}
                      (Stage: <strong>{existingDeal.stage}</strong>).
                      What would you like to do?
                    </p>
                    
                    {/* Options */}
                    <div className="space-y-2 mb-4">
                      <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-warning-100 rounded transition-colors">
                        <input
                          type="radio"
                          checked={!createDealAnyway}
                          onChange={() => setCreateDealAnyway(false)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-warning-900">
                            Go to Existing Deal
                          </div>
                          <div className="text-xs text-warning-700">
                            Navigate to Deal #{existingDeal.dealId} instead of creating duplicate (analysis will not be saved)
                          </div>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-warning-100 rounded transition-colors">
                        <input
                          type="radio"
                          checked={createDealAnyway}
                          onChange={() => setCreateDealAnyway(true)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-warning-900">
                            Create New Deal Anyway
                          </div>
                          <div className="text-xs text-warning-700">
                            Create another deal for this same address (not recommended)
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* View Deal Button - Preview in new tab */}
                    {!createDealAnyway && (
                      <a
                        href={`/dashboard/dealiq?deal=${existingDeal.dealId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        <Briefcase className="w-4 h-4" />
                        Preview Deal #{existingDeal.dealId}
                        <span className="text-xs text-neutral-500">↗</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Existing Analysis Warning */}
            {existingAnalysis && (
              <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-warning-900 mb-1">
                      Analysis Already Exists
                    </h3>
                    <p className="text-sm text-warning-800 mb-3">
                      An analysis for "{existingAnalysis.name}" already exists. 
                      What would you like to do?
                    </p>
                    
                    {/* Override Options */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={overrideExisting}
                          onChange={() => setOverrideExisting(true)}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-warning-900">
                          Update existing analysis
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!overrideExisting}
                          onChange={() => setOverrideExisting(false)}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-warning-900">
                          Save as new analysis
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-sm text-error-800">{error}</p>
              </div>
            )}

            {/* Info for Non-Premium */}
            {!isPremium && (
              <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-sm text-primary-800">
                  💡 Analysis will be saved locally. Upgrade to Premium to save to your account and organize with groups.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={onClose}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!propertyName.trim()}
                className="px-6"
              >
                Calculate & Save
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}