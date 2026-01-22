// FILE LOCATION: /src/hooks/useDraftAnalysis.ts
// FIXED: Prevents loading drafts when pre-populating from deal data
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { AnalysisInputs, DraftAnalysis, SaveStatus } from '@/types'
import { 
  getStorageItem, 
  setStorageItem, 
  removeStorageItem,
  STORAGE_KEYS 
} from '@/lib/utils'

// Generate a unique ID for drafts
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

const DRAFT_AUTO_SAVE_DELAY = 3000 // 3 seconds
const MAX_DRAFTS = 10

interface UseDraftAnalysisProps {
  analysisId?: string
  initialStep?: number
  skipDraftLoad?: boolean  // ✅ NEW: Skip loading draft from storage
}

interface UseDraftAnalysisReturn {
  draft: DraftAnalysis | null
  saveStatus: SaveStatus
  lastSaved: number | null
  isSaving: boolean
  saveDraft: (
    data: Partial<AnalysisInputs>,
    step: number,
    results?: any,
    draftName?: string
  ) => Promise<DraftAnalysis>
  autoSaveDraft: (
    data: Partial<AnalysisInputs>,
    step: number,
    results?: any
  ) => void
  createNewDraft: () => DraftAnalysis
  deleteDraft: (draftId: string) => void
  renameDraft: (draftId: string, newName: string) => void
  clearCurrentDraft: () => void
  getAllDrafts: () => DraftAnalysis[]
  loadDraft: (draftId?: string) => void
}

export function useDraftAnalysis({ 
  analysisId, 
  initialStep = 1,
  skipDraftLoad = false  // ✅ NEW: Default to false for backward compatibility
}: UseDraftAnalysisProps = {}): UseDraftAnalysisReturn {
  // Get userId from Clerk for user-scoped storage
  const { user, isLoaded } = useUser()
  const userId = user?.id
  
  // State
  const [draft, setDraft] = useState<DraftAnalysis | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('unsaved')
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const lastSaveDataRef = useRef<string>('') // Track last saved data to prevent unnecessary saves

  // Keep track of mount state
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Helper: Check if data has actually changed
  const hasDataChanged = useCallback((newData: any, oldData: any): boolean => {
    try {
      const newJson = JSON.stringify(newData)
      const oldJson = JSON.stringify(oldData)
      return newJson !== oldJson
    } catch {
      return true
    }
  }, [])

  // Helper: Create a default draft
  const createDefaultDraft = useCallback((): DraftAnalysis => {
    const now = Date.now()
    return {
      id: generateId(),
      timestamp: now,
      lastModified: now,
      name: `New Analysis ${new Date(now).toLocaleDateString()}`,
      data: {
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
      },
      step: 1,
    }
  }, [])

  // Load a specific draft or the current one
  const loadDraft = useCallback((specificDraftId?: string) => {
    // ✅ NEW: Skip loading if we're told to skip
    if (skipDraftLoad) {
      console.log('⏭️ Skipping draft load - pre-populating from deal data')
      return
    }

    try {
      const drafts = getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.DRAFTS, [], userId)
      let draftToLoad: DraftAnalysis | null = null
      
      if (specificDraftId) {
        // Load specific draft
        draftToLoad = drafts.find(d => d.id === specificDraftId) || null
      } else {
        // Load current draft
        draftToLoad = getStorageItem<DraftAnalysis | null>(STORAGE_KEYS.CURRENT_ANALYSIS, null, userId)
      }

      if (draftToLoad) {
        setDraft(draftToLoad)
        setLastSaved(draftToLoad.lastModified)
        setSaveStatus('saved')
        lastSaveDataRef.current = JSON.stringify(draftToLoad.data)
      } else if (!specificDraftId) {
        // No current draft, create a new one
        const newDraft = createDefaultDraft()
        setDraft(newDraft)
        setStorageItem(STORAGE_KEYS.CURRENT_ANALYSIS, newDraft, userId)
        setSaveStatus('saved')
        lastSaveDataRef.current = JSON.stringify(newDraft.data)
      }
    } catch (error) {
      console.error('Error loading draft:', error)
      setSaveStatus('error')
    }
  }, [createDefaultDraft, userId, skipDraftLoad])  // ✅ ADDED skipDraftLoad to dependencies

  // Load draft on mount or when analysisId/userId changes
  // IMPORTANT: Wait for Clerk to load before accessing storage
  useEffect(() => {
    if (!isLoaded) {
      // Clear state while Clerk is loading to prevent showing wrong user's data
      setDraft(null)
      setSaveStatus('unsaved')
      setLastSaved(null)
      lastSaveDataRef.current = ''
      return
    }

    // ✅ NEW: Skip loading if skipDraftLoad is true
    if (skipDraftLoad) {
      console.log('⏭️ useDraftAnalysis: skipDraftLoad=true, not loading from storage')
      return
    }

    if (isMountedRef.current) {
      // Clear any existing draft first when userId changes
      setDraft(null)
      
      // Then load the correct draft for current user
      loadDraft()
    }
  }, [analysisId, userId, isLoaded, loadDraft, skipDraftLoad])  // ✅ ADDED skipDraftLoad to dependencies

  // Save draft with debouncing
  const saveDraft = useCallback(async (
    data: Partial<AnalysisInputs>,
    step: number,
    results?: any,
    draftName?: string
  ): Promise<DraftAnalysis> => {
    if (!isMountedRef.current) {
      throw new Error('Component not mounted')
    }

    // Check if we're already saving
    if (isSaving) {
      return draft!
    }

    setIsSaving(true)
    setSaveStatus('saving')

    try {
      const now = Date.now()
      
      // Generate or use existing draft ID
      let draftId = analysisId || draft?.id
      let timestamp = draft?.timestamp || now
      
      // If no draft exists, create a new ID
      if (!draftId) {
        draftId = generateId()
        timestamp = now
      }

      // Create the draft object
      const newDraft: DraftAnalysis = {
        id: draftId,
        timestamp,
        lastModified: now,
        name: draftName || draft?.name || `Analysis ${new Date(now).toLocaleDateString()}`,
        data,
        step,
        results,
      }

      // Check if data actually changed
      const newDataJson = JSON.stringify(data)
      if (newDataJson === lastSaveDataRef.current && draft?.step === step) {
        // Data hasn't changed, skip saving
        console.log('Data unchanged, skipping save')
        setSaveStatus('saved')
        return newDraft
      }

      // Save to localStorage
      setStorageItem(STORAGE_KEYS.CURRENT_ANALYSIS, newDraft, userId)
      
      // Update drafts list
      const drafts = getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.DRAFTS, [], userId)
      const draftIndex = drafts.findIndex(d => d.id === draftId)
      
      if (draftIndex >= 0) {
        drafts[draftIndex] = newDraft
      } else {
        drafts.unshift(newDraft)
        // Keep only latest MAX_DRAFTS
        if (drafts.length > MAX_DRAFTS) {
          drafts.pop()
        }
      }
      
      setStorageItem(STORAGE_KEYS.DRAFTS, drafts, userId)
      
      // Update state
      setDraft(newDraft)
      setLastSaved(now)
      setSaveStatus('saved')
      lastSaveDataRef.current = newDataJson
      
      console.log('Draft saved successfully:', { id: draftId, step, name: newDraft.name })
      
      return newDraft
    } catch (error) {
      console.error('Error saving draft:', error)
      setSaveStatus('error')
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [analysisId, draft, isSaving, userId])  // ✅ ADDED userId to dependencies

  // Auto-save with debouncing
  const autoSaveDraft = useCallback((
    data: Partial<AnalysisInputs>,
    step: number,
    results?: any
  ) => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Don't auto-save if we're already saving
    if (isSaving) {
      return
    }

    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        saveDraft(data, step, results).catch(error => {
          console.error('Auto-save failed:', error)
        })
      }
    }, DRAFT_AUTO_SAVE_DELAY)

    // Only show "unsaved" if we actually have changes
    const currentDataJson = JSON.stringify(data)
    if (currentDataJson !== lastSaveDataRef.current || draft?.step !== step) {
      setSaveStatus('unsaved')
    }
  }, [saveDraft, isSaving, draft?.step])

  // Create a new draft
  const createNewDraft = useCallback((): DraftAnalysis => {
    const newDraft = createDefaultDraft()
    
    // Save to localStorage
    setStorageItem(STORAGE_KEYS.CURRENT_ANALYSIS, newDraft, userId)
    
    // Add to drafts list
    const drafts = getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.DRAFTS, [], userId)
    drafts.unshift(newDraft)
    if (drafts.length > MAX_DRAFTS) {
      drafts.pop()
    }
    setStorageItem(STORAGE_KEYS.DRAFTS, drafts, userId)
    
    // Update state
    setDraft(newDraft)
    setLastSaved(newDraft.lastModified)
    setSaveStatus('saved')
    lastSaveDataRef.current = JSON.stringify(newDraft.data)
    
    return newDraft
  }, [createDefaultDraft, userId])

  // Delete a draft
  const deleteDraft = useCallback((draftId: string): void => {
    const drafts = getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.DRAFTS, [], userId)
    const updatedDrafts = drafts.filter(d => d.id !== draftId)
    setStorageItem(STORAGE_KEYS.DRAFTS, updatedDrafts, userId)
    
    // If deleting current draft, clear it
    if (draft?.id === draftId) {
      setDraft(null)
      removeStorageItem(STORAGE_KEYS.CURRENT_ANALYSIS, userId)
      setSaveStatus('unsaved')
      setLastSaved(null)
      lastSaveDataRef.current = ''
    }
  }, [draft, userId])

  // Rename a draft
  const renameDraft = useCallback((draftId: string, newName: string): void => {
    const drafts = getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.DRAFTS, [], userId)
    const draftIndex = drafts.findIndex(d => d.id === draftId)
    
    if (draftIndex >= 0) {
      const updatedDraft = {
        ...drafts[draftIndex],
        name: newName,
        lastModified: Date.now(),
      }
      
      drafts[draftIndex] = updatedDraft
      setStorageItem(STORAGE_KEYS.DRAFTS, drafts, userId)
      
      // Update current draft if it's the one being renamed
      if (draft?.id === draftId) {
        setDraft(updatedDraft)
        setLastSaved(updatedDraft.lastModified)
      }
    }
  }, [draft, userId])

  // Clear current draft
  const clearCurrentDraft = useCallback((): void => {
    setDraft(null)
    removeStorageItem(STORAGE_KEYS.CURRENT_ANALYSIS, userId)
    setSaveStatus('unsaved')
    setLastSaved(null)
    lastSaveDataRef.current = ''
  }, [userId])

  // Get all drafts
  const getAllDrafts = useCallback((): DraftAnalysis[] => {
    return getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.DRAFTS, [], userId)
  }, [userId])

  return {
    draft,
    saveStatus,
    lastSaved,
    isSaving,
    saveDraft,
    autoSaveDraft,
    createNewDraft,
    deleteDraft,
    renameDraft,
    clearCurrentDraft,
    getAllDrafts,
    loadDraft,
  }
}