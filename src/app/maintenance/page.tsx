'use client'

import { MaintenancePage } from '@/components/MaintenancePage'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function MaintenanceRoute() {
  const { settings } = useSystemSettings()
  const router = useRouter()

  // If maintenance mode is off, redirect home
  useEffect(() => {
    if (settings && !settings.maintenanceMode) {
      router.push('/')
    }
  }, [settings, router])

  return <MaintenancePage message={settings?.maintenanceMessage || undefined} />
}