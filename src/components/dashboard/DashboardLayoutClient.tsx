// src/components/dashboard/DashboardLayoutClient.tsx
'use client'

import { ReactNode } from 'react'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { useSubscription } from '@/contexts/SubscriptionContext'

interface DashboardLayoutClientProps {
  children: ReactNode
}

export default function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const { status, trialHoursRemaining, isLoading } = useSubscription()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar 
          userSubscriptionStatus={status}
          trialHoursRemaining={trialHoursRemaining}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}