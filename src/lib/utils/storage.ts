// src/lib/utils/storage.ts

/**
 * Get user-scoped storage key
 */
function getUserScopedKey(baseKey: string, userId?: string): string {
  if (!userId) {
    // If no userId (user not logged in), use global key
    return baseKey
  }
  return `${baseKey}_${userId}`
}

/**
 * Local Storage keys for our application
 * These should be accessed via getUserScopedKey to ensure user isolation
 */
export const STORAGE_KEYS = {
  CURRENT_ANALYSIS: 'multifamily_current_analysis',
  SAVED_ANALYSES: 'multifamily_saved_analyses',
  DRAFTS: 'multifamily_draft_analyses',
} as const

/**
 * Safely get item from localStorage with error handling
 * Automatically scopes to userId if provided
 */
export function getStorageItem<T>(key: string, defaultValue: T, userId?: string): T {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  try {
    const scopedKey = getUserScopedKey(key, userId)
    const item = localStorage.getItem(scopedKey)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error)
    return defaultValue
  }
}

/**
 * Safely set item to localStorage with error handling
 * Automatically scopes to userId if provided
 */
export function setStorageItem<T>(key: string, value: T, userId?: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const scopedKey = getUserScopedKey(key, userId)
    localStorage.setItem(scopedKey, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error)
  }
}

/**
 * Remove item from localStorage
 * Automatically scopes to userId if provided
 */
export function removeStorageItem(key: string, userId?: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const scopedKey = getUserScopedKey(key, userId)
    localStorage.removeItem(scopedKey)
  } catch (error) {
    console.error(`Error removing from localStorage key "${key}":`, error)
  }
}

/**
 * Clear all application data from localStorage for a specific user
 */
export function clearAppStorage(userId?: string): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeStorageItem(key, userId)
  })
}

/**
 * Clear all application data from localStorage (all users)
 * Use this when user logs out to clean up their data
 */
export function clearAllUserStorage(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    // Remove all keys that start with our app prefix
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('multifamily_')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  } catch (error) {
    console.error('Error clearing all user storage:', error)
  }
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