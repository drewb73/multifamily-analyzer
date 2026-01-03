import { useEffect, useState } from 'react'

interface SystemSettings {
  accountDeletionEnabled: boolean
  pdfExportEnabled: boolean
  analysisEnabled: boolean
  savedDraftsEnabled: boolean
  maintenanceMode: boolean
  signUpEnabled: boolean
  signInEnabled: boolean
  stripeEnabled: boolean
  // Add other settings as needed
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      try {
        // Add timestamp to prevent caching
        const response = await fetch(`/api/system-settings?t=${Date.now()}`)
        if (response.ok) {
          const data = await response.json()
          setSettings(data.settings)
        }
      } catch (error) {
        console.error('Failed to fetch system settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Fetch immediately
    fetchSettings()
    
    // Poll every 10 seconds for updates
    const interval = setInterval(fetchSettings, 10000)
    
    return () => clearInterval(interval)
  }, [])

  return { settings, isLoading }
}