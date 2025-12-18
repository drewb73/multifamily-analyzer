// src/lib/api/analyses.ts
/**
 * API Helper functions for PropertyAnalysis operations
 */

import { AnalysisInputs } from '@/types'

export interface SaveAnalysisParams {
  name: string
  data: AnalysisInputs
  results: any
  groupId?: string | null
  notes?: string
}

/**
 * Save analysis to database (Premium only)
 */
export async function saveAnalysisToDatabase(params: SaveAnalysisParams) {
  const response = await fetch('/api/analyses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to save analysis')
  }

  return response.json()
}

/**
 * Fetch user's analyses from database
 */
export async function fetchAnalyses(params?: {
  search?: string
  groupId?: string
  zipCode?: string
  city?: string
  state?: string
  unitsMin?: number
  unitsMax?: number
  priceMin?: number
  priceMax?: number
  capRateMin?: number
  capRateMax?: number
  isFavorite?: boolean
  isArchived?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}) {
  const searchParams = new URLSearchParams()
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })
  }

  const response = await fetch(`/api/analyses?${searchParams.toString()}`, {
    cache: 'no-store', // Disable caching to always get fresh data
    headers: {
      'Cache-Control': 'no-cache'
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch analyses')
  }

  return response.json()
}

/**
 * Update analysis (name, group, favorite, archived, data, results)
 */
export async function updateAnalysis(
  id: string,
  updates: {
    name?: string
    groupId?: string | null
    notes?: string
    isFavorite?: boolean
    isArchived?: boolean
    data?: AnalysisInputs
    results?: any
  }
) {
  const response = await fetch(`/api/analyses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update analysis')
  }

  return response.json()
}

/**
 * Delete analysis
 */
export async function deleteAnalysis(id: string) {
  const response = await fetch(`/api/analyses/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete analysis')
  }

  return response.json()
}

/**
 * Get single analysis
 */
export async function getAnalysis(id: string) {
  const response = await fetch(`/api/analyses/${id}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch analysis')
  }

  return response.json()
}