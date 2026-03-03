// FILE LOCATION: /src/app/dashboard/settings/page.tsx
// COMPLETE FILE - Replace entire file
// UPDATED: Hide billing section for team members

'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { ProfileCard } from '@/components/settings/ProfileCard'
import { AccountCard } from '@/components/settings/AccountCard'
import { SecurityCard } from '@/components/settings/SecurityCard'
import { BillingCard } from '@/components/settings/BillingCard'
import { TeamCard } from '@/components/settings/TeamCard'
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
    source: string | null
    trialEndsAt: Date | null
    subscriptionEndsAt: Date | null
    cancelledAt: Date | null
    isTeamMember: boolean
  }>({
    status: 'free',
    source: null,
    trialEndsAt: null,
    subscriptionEndsAt: null,
    cancelledAt: null,
    isTeamMember: false
  })
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [billingLoading, setBillingLoading] = useState(false)
  const [hasTeamMembers, setHasTeamMembers] = useState(false)
  
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
  
  // Check if user has team members
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
          company: (user as any).company || ''
        })
        
        setSubscriptionData({
          status: data.subscriptionStatus || 'free',
          source: data.subscriptionSource || null,
          trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null,
          subscriptionEndsAt: data.subscriptionEndsAt ? new Date(data.subscriptionEndsAt) : null,
          cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : null,
          isTeamMember: data.isTeamMember || false,
        })
        
        // Only load billing history for non-team members
        if (!data.isTeamMember) {
          loadBillingHistory()
        }
        
        checkTeamStatus()
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

  // Show TeamCard for ALL premium/enterprise users OR team members
  const isPremium = subscriptionData.status === 'premium' || subscriptionData.status === 'enterprise'
  const showTeamCard = isPremium || subscriptionData.isTeamMember
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

        {/* Team Workspace Card - Show for all premium users */}
        {showTeamCard && (
          <TeamCard
            isTeamMember={subscriptionData.isTeamMember}
            isWorkspaceOwner={isWorkspaceOwner}
          />
        )}

        {/* Security */}
        <SecurityCard />
        
        {/* Billing - Only show for NON-team members */}
        {!subscriptionData.isTeamMember && settings?.stripeEnabled && (
          <BillingCard
            subscriptionStatus={subscriptionData.status}
            subscriptionSource={subscriptionData.source}
            subscriptionEndsAt={subscriptionData.subscriptionEndsAt}
            cancelledAt={subscriptionData.cancelledAt}
            billingHistory={billingHistory}
          />
        )}
        
        {/* Show message for team members if Stripe enabled but they can't see billing */}
        {subscriptionData.isTeamMember && settings?.stripeEnabled && (
          <div className="elevated-card p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Billing & Subscription
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 font-medium mb-2">Team Member Account</p>
              <p className="text-blue-700 text-sm">
                You're part of a team workspace. Billing is managed by your workspace owner.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}