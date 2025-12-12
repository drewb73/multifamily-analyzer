// src/hooks/useDraftAnalysis.ts
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AnalysisInputs, DraftAnalysis, SaveStatus } from '@/types'
import { 
  getStorageItem, 
  setStorageItem, 
  removeStorageItem,  // Add this import
  STORAGE_KEYS
} from '@/lib/utils'

// Add generateId function since it might not be exported
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

const DRAFT_AUTO_SAVE_DELAY = 5000 // 5 seconds
const MAX_DRAFTS = 10

interface UseDraftAnalysisProps {
  analysisId?: string
  initialStep?: number
}

export function useDraftAnalysis({ 
  analysisId, 
  initialStep = 1 
}: UseDraftAnalysisProps = {}) {
  const [draft, setDraft] = useState<DraftAnalysis | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('unsaved')
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)

  // Load draft on mount
  useEffect(() => {
    loadDraft()
  }, [analysisId])

  // Auto-save effect
  useEffect(() => {
    return () => {
      // Clear timeout on unmount
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  const loadDraft = useCallback(() => {
    try {
      const drafts = getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.DRAFTS, [])
      const currentDraft = getStorageItem<DraftAnalysis | null>(STORAGE_KEYS.CURRENT_ANALYSIS, null)
      
      if (analysisId) {
        // Load specific draft by ID
        const foundDraft = drafts.find(d => d.id === analysisId)
        if (foundDraft) {
          setDraft(foundDraft)
          setLastSaved(foundDraft.lastModified)
          setSaveStatus('saved')
        }
      } else if (currentDraft) {
        // Load current draft
        setDraft(currentDraft)
        setLastSaved(currentDraft.lastModified)
        setSaveStatus('saved')
      }
    } catch (error) {
      console.error('Error loading draft:', error)
      setSaveStatus('error')
    }
  }, [analysisId])

  const saveDraft = useCallback(async (
    data: Partial<AnalysisInputs>,
    step: number,
    results?: any,
    draftName?: string
  ): Promise<DraftAnalysis> => {
    if (isSavingRef.current) {
      return draft!
    }

    isSavingRef.current = true
    setSaveStatus('saving')

    try {
      const now = Date.now()
      const draftId = analysisId || draft?.id || generateId()
      
      const newDraft: DraftAnalysis = {
        id: draftId,
        timestamp: draft?.timestamp || now,
        lastModified: now,
        name: draftName || draft?.name || `Analysis ${new Date(now).toLocaleDateString()}`,
        data,
        step,
        results,
      }

      // Update current draft
      setStorageItem(STORAGE_KEYS.CURRENT_ANALYSIS, newDraft)
      
      // Update drafts list
      const drafts = getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.DRAFTS, [])
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
      
      setStorageItem(STORAGE_KEYS.DRAFTS, drafts)
      
      setDraft(newDraft)
      setLastSaved(now)
      setSaveStatus('saved')
      
      return newDraft
    } catch (error) {
      console.error('Error saving draft:', error)
      setSaveStatus('error')
      throw error
    } finally {
      isSavingRef.current = false
    }
  }, [analysisId, draft])

  const autoSaveDraft = useCallback((
    data: Partial<AnalysisInputs>,
    step: number,
    results?: any
  ) => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDraft(data, step, results).catch(console.error)
    }, DRAFT_AUTO_SAVE_DELAY)

    setSaveStatus('unsaved')
  }, [saveDraft])

  const createNewDraft = useCallback((): DraftAnalysis => {
    const now = Date.now()
    const newDraft: DraftAnalysis = {
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

    setDraft(newDraft)
    setStorageItem(STORAGE_KEYS.CURRENT_ANALYSIS, newDraft)
    setSaveStatus('saved')
    
    return newDraft
  }, [])

  const deleteDraft = useCallback((draftId: string): void => {
    const drafts = getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.DRAFTS, [])
    const updatedDrafts = drafts.filter(d => d.id !== draftId)
    setStorageItem(STORAGE_KEYS.DRAFTS, updatedDrafts)
    
    // If deleting current draft, clear it
    if (draft?.id === draftId) {
      setDraft(null)
      removeStorageItem(STORAGE_KEYS.CURRENT_ANALYSIS)
    }
  }, [draft])

  const renameDraft = useCallback((draftId: string, newName: string): void => {
    const drafts = getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.DRAFTS, [])
    const draftIndex = drafts.findIndex(d => d.id === draftId)
    
    if (draftIndex >= 0) {
      drafts[draftIndex] = {
        ...drafts[draftIndex],
        name: newName,
        lastModified: Date.now(),
      }
      setStorageItem(STORAGE_KEYS.DRAFTS, drafts)
      
      // Update current draft if it's the one being renamed
      if (draft?.id === draftId) {
        setDraft(drafts[draftIndex])
      }
    }
  }, [draft])

  const clearCurrentDraft = useCallback((): void => {
    setDraft(null)
    removeStorageItem(STORAGE_KEYS.CURRENT_ANALYSIS)
    setSaveStatus('unsaved')
    setLastSaved(null)
  }, [])

  const getAllDrafts = useCallback((): DraftAnalysis[] => {
    return getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.DRAFTS, [])
  }, [])

  return {
    draft,
    saveStatus,
    lastSaved,
    saveDraft,
    autoSaveDraft,
    createNewDraft,
    deleteDraft,
    renameDraft,
    clearCurrentDraft,
    getAllDrafts,
    loadDraft,
    isSaving: isSavingRef.current,
  }
}