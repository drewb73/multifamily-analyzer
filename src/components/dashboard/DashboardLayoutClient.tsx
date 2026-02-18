// COMPLETE FILE - CLIENT COMPONENT FOR DASHBOARD LAYOUT WITH TEAM MEMBER SUPPORT
// Location: src/components/dashboard/DashboardLayoutClient.tsx
// Action: REPLACE ENTIRE FILE

'use client'

import { useState } from 'react'
import DashboardSidebar from "@/components/dashboard/Sidebar"
import DashboardHeader from "@/components/dashboard/DashboardHeader"

interface DashboardLayoutClientProps {
  userSubscriptionStatus: string | null
  trialHoursRemaining: number
  isTeamMember: boolean
  children: React.ReactNode
}

export default function DashboardLayoutClient({
  userSubscriptionStatus,
  trialHoursRemaining,
  isTeamMember,
  children
}: DashboardLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader 
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar 
          userSubscriptionStatus={userSubscriptionStatus}
          trialHoursRemaining={trialHoursRemaining}
          isTeamMember={isTeamMember}
          mobileMenuOpen={mobileMenuOpen}
          onMobileMenuClose={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}