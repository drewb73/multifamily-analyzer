'use client'

import { AlertTriangle } from 'lucide-react'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { useIsAdmin } from '@/hooks/useIsAdmin'

export function AdminMaintenanceBanner() {
  const { settings: systemSettings, isLoading: settingsLoading } = useSystemSettings()
  const { isAdmin, isLoading: adminLoading } = useIsAdmin()
  
  // Don't show while loading
  if (settingsLoading || adminLoading) {
    return null
  }
  
  // Only show if maintenance mode is on and user is admin
  if (!systemSettings?.maintenanceMode || !isAdmin) {
    return null
  }

  return (
    <div className="bg-error-600 text-white py-3 px-4 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">
          <span className="font-bold">MAINTENANCE MODE ACTIVE:</span> You're seeing this site because you're an admin. Regular users see the maintenance page.
        </p>
      </div>
    </div>
  )
}