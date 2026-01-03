import { useEffect, useState } from 'react'

interface SystemSettings {
  accountDeletionEnabled: boolean
  pdfExportEnabled: boolean
  analysisEnabled: boolean
  savedDraftsEnabled: boolean
  maintenanceMode: boolean
  signUpEnabled: boolean
  dashboardEnabled: boolean
  stripeEnabled: boolean
  // Add other settings as needed
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchSettings = async () => {
      try {
        // Add timestamp to prevent caching
        const response = await fetch(`/api/system-settings?t=${Date.now()}`)
        const data = await response.json()
        
        if (mounted && data.success) {
          setSettings(data.settings)
        }
      } catch (error) {
        console.error('Failed to fetch system settings:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchSettings()

    // Poll every 10 seconds for updates
    const interval = setInterval(fetchSettings, 10000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return { settings, isLoading }
}