import { prisma } from '@/lib/prisma'

// Cache settings for 5 seconds to avoid too many DB calls
let cachedSettings: any = null
let cacheTime = 0
const CACHE_DURATION = 5 * 1000 // 5 seconds

export async function getSystemSettings() {
  const now = Date.now()
  
  // Return cached settings if still valid
  if (cachedSettings && (now - cacheTime) < CACHE_DURATION) {
    return cachedSettings
  }
  
  // Fetch from database
  let settings = await prisma.systemSettings.findFirst()
  
  // If no settings exist, return defaults
  if (!settings) {
    settings = {
      id: '',
      maintenanceMode: false,
      maintenanceMessage: null,
      signInEnabled: true,
      signUpEnabled: true,
      stripeEnabled: true,
      analysisEnabled: true,
      pdfExportEnabled: true,
      savedDraftsEnabled: true,
      accountDeletionEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: null
    }
  }
  
  // Cache it
  cachedSettings = settings
  cacheTime = now
  
  return settings
}

// Function to clear cache (call this after updating settings)
export function clearSettingsCache() {
  cachedSettings = null
  cacheTime = 0
}