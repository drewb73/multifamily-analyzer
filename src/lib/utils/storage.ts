// src/lib/utils/storage.ts

/**
 * Local Storage keys for our application
 */
export const STORAGE_KEYS = {
  CURRENT_ANALYSIS: 'multifamily_current_analysis',
  SAVED_ANALYSES: 'multifamily_saved_analyses',
  DRAFTS: 'multifamily_draft_analyses',
} as const

/**
 * Safely get item from localStorage with error handling
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error)
    return defaultValue
  }
}

/**
 * Safely set item to localStorage with error handling
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error)
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing from localStorage key "${key}":`, error)
  }
}

/**
 * Clear all application data from localStorage
 */
export function clearAppStorage(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeStorageItem(key)
  })
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch (error) {
    console.error('localStorage is not available:', error)
    return false
  }
}