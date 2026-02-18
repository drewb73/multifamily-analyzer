// FILE LOCATION: /src/app/dashboard/settings/page.tsx
// UPDATED: Added TeamCard link

'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { ProfileCard } from '@/components/settings/ProfileCard'
import { AccountCard } from '@/components/settings/AccountCard'
import { SecurityCard } from '@/components/settings/SecurityCard'
import { BillingCard } from '@/components/settings/BillingCard'
import { TeamCard } from '@/components/settings/TeamCard'  // ✅ NEW
import { SubscriptionStatus } from '@/lib/subscription'
import { useSystemSettings } from '@/hooks/useSystemSettings'

export default function SettingsPage() {
  const { user } = useUser()
  const { settings } = useSystemSettings()
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState({
    displayName: '',
    email: '',
    company: ''
  })
  const [subscriptionData, setSubscriptionData] = useState<{
    status: SubscriptionStatus
    trialEndsAt: Date | null
    subscriptionEndsAt: Date | null
    cancelledAt: Date | null
    isTeamMember: boolean
  }>({
    status: 'free',
    trialEndsAt: null,
    subscriptionEndsAt: null,
    cancelledAt: null,
    isTeamMember: false
  })
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [billingLoading, setBillingLoading] = useState(false)
  const [hasTeamMembers, setHasTeamMembers] = useState(false)  // ✅ NEW
  
  const loadBillingHistory = async () => {
    if (!user) return
    
    setBillingLoading(true)
    try {
      const response = await fetch('/api/billing/history')
      if (response.ok) {
        const data = await response.json()
        setBillingHistory(data.billingHistory || [])
      }
    } catch (error) {
      console.error('Failed to load billing history:', error)
    } finally {
      setBillingLoading(false)
    }
  }
  
  // ✅ NEW: Check if user has team members
  const checkTeamStatus = async () => {
    try {
      const response = await fetch('/api/team/members')
      if (response.ok) {
        const data = await response.json()
        setHasTeamMembers(data.members && data.members.length > 0)
      }
    } catch (error) {
      console.error('Failed to check team status:', error)
    }
  }
  
  const loadUserData = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile({
          displayName: data.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: data.email || user.emailAddresses[0]?.emailAddress || '',
          company: data.company || ''
        })
        
        setSubscriptionData({
          status: data.subscriptionStatus || 'free',
          trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null,
          subscriptionEndsAt: data.subscriptionEndsAt ? new Date(data.subscriptionEndsAt) : null,
          cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : null,
          isTeamMember: data.isTeamMember || false
        })
        
        loadBillingHistory()
        checkTeamStatus()  // ✅ NEW
      } else {
        setUserProfile({
          displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.emailAddresses[0]?.emailAddress || '',
          company: ''
        })
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    loadUserData()
  }, [user])
  
  const handleSaveProfile = async (data: typeof userProfile) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save profile')
      }
      
      const updated = await response.json()
      setUserProfile(data)
      
      if (data.email !== userProfile.email) {
        alert('Email updated! Please check your inbox to verify your new email address.')
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      throw error
    }
  }
  
  const handleRefreshSubscription = () => {
    loadUserData()
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // ✅ NEW: Determine if user is workspace owner (has team members but is not a team member themselves)
  const isWorkspaceOwner = hasTeamMembers && !subscriptionData.isTeamMember
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900">
          Account Settings
        </h1>
        <p className="text-lg text-neutral-600 mt-2">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Account Information */}
        <AccountCard
          subscriptionStatus={subscriptionData.status}
          trialEndsAt={subscriptionData.trialEndsAt}
          isTeamMember={subscriptionData.isTeamMember}
          onRefresh={handleRefreshSubscription}
        />
        
        {/* Profile */}
        <ProfileCard
          initialData={userProfile}
          onSave={handleSaveProfile}
        />

        {/* ✅ NEW: Team Workspace Card */}
        {(subscriptionData.isTeamMember || isWorkspaceOwner) && (
          <TeamCard
            isTeamMember={subscriptionData.isTeamMember}
            isWorkspaceOwner={isWorkspaceOwner}
          />
        )}

        {/* Security */}
        <SecurityCard />
        
        {settings?.stripeEnabled ? (
          <BillingCard
            subscriptionStatus={subscriptionData.status}
            subscriptionEndsAt={subscriptionData.subscriptionEndsAt}
            cancelledAt={subscriptionData.cancelledAt}
            billingHistory={billingHistory}
          />
        ) : (
          <div className="elevated-card p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Billing & Subscription
            </h2>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-center">
              <p className="text-neutral-600">
                Payment management is temporarily unavailable
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}