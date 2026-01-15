// FILE LOCATION: /src/app/dashboard/settings/page.tsx
// IMPROVEMENT: Fetch and pass cancelledAt to BillingCard for cancelled subscription display

'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { ProfileCard } from '@/components/settings/ProfileCard'
import { AccountCard } from '@/components/settings/AccountCard'
import { SecurityCard } from '@/components/settings/SecurityCard'
import { BillingCard } from '@/components/settings/BillingCard'
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
    cancelledAt: Date | null // ✅ NEW: Track cancellation date
  }>({
    status: 'free',
    trialEndsAt: null,
    subscriptionEndsAt: null,
    cancelledAt: null // ✅ NEW
  })
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  
  // Load user data
  const loadUserData = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Fetch user profile from MongoDB
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile({
          displayName: data.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: data.email || user.emailAddresses[0]?.emailAddress || '',
          company: data.company || ''
        })
        
        // ✅ UPDATED: Also fetch cancelledAt
        setSubscriptionData({
          status: data.subscriptionStatus || 'free',
          trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null,
          subscriptionEndsAt: data.subscriptionEndsAt ? new Date(data.subscriptionEndsAt) : null,
          cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : null // ✅ NEW
        })
        
        // Set billing history (will be populated after Stripe integration)
        setBillingHistory(data.billingHistory || [])
      } else {
        // Fallback to Clerk data if profile doesn't exist yet
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
  
  // Save profile changes
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
      
      // If email changed, might need to trigger verification
      if (data.email !== userProfile.email) {
        alert('Email updated! Please check your inbox to verify your new email address.')
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      throw error
    }
  }
  
  // Refresh subscription data after upgrade/cancel
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
          onRefresh={handleRefreshSubscription}
        />
        
        {/* Profile */}
        <ProfileCard
          initialData={userProfile}
          onSave={handleSaveProfile}
        />

        {/* Security */}
        <SecurityCard />
        
        {/* ✅ UPDATED: Pass cancelledAt to BillingCard */}
        {settings?.stripeEnabled ? (
          <BillingCard
            subscriptionStatus={subscriptionData.status}
            subscriptionEndsAt={subscriptionData.subscriptionEndsAt}
            cancelledAt={subscriptionData.cancelledAt} // ✅ NEW: Pass cancellation date
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