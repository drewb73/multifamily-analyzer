// src/contexts/SubscriptionContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useUser } from '@clerk/nextjs'

export type SubscriptionStatus = 'free' | 'trial' | 'premium' | 'enterprise'

interface SubscriptionData {
  status: SubscriptionStatus
  trialEndsAt: Date | null
  trialHoursRemaining: number
  hasUsedTrial: boolean
  isPremium: boolean
  isTrial: boolean
  isFree: boolean
  isLoading: boolean
}

interface SubscriptionContextType extends SubscriptionData {
  refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser()
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    status: 'free',
    trialEndsAt: null,
    trialHoursRemaining: 0,
    hasUsedTrial: false,
    isPremium: false,
    isTrial: false,
    isFree: true,
    isLoading: true,
  })

  const fetchSubscriptionStatus = async () => {
    if (!user) {
      setSubscriptionData({
        status: 'free',
        trialEndsAt: null,
        trialHoursRemaining: 0,
        hasUsedTrial: false,
        isPremium: false,
        isTrial: false,
        isFree: true,
        isLoading: false,
      })
      return
    }

    try {
      const response = await fetch('/api/subscription/status')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionData({
          status: data.subscription.status,
          trialEndsAt: data.subscription.trialEndsAt ? new Date(data.subscription.trialEndsAt) : null,
          trialHoursRemaining: data.subscription.trialHoursRemaining || 0,
          hasUsedTrial: data.subscription.hasUsedTrial,
          isPremium: data.subscription.isPremium,
          isTrial: data.subscription.isTrial,
          isFree: data.subscription.isFree,
          isLoading: false,
        })
      } else {
        // Fallback to free if API fails
        setSubscriptionData(prev => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error)
      setSubscriptionData(prev => ({ ...prev, isLoading: false }))
    }
  }

  // Initial load
  useEffect(() => {
    if (isLoaded) {
      fetchSubscriptionStatus()
    }
  }, [user, isLoaded])

  // Refresh function that can be called after upgrade/cancel
  const refreshSubscription = async () => {
    await fetchSubscriptionStatus()
  }

  return (
    <SubscriptionContext.Provider 
      value={{ 
        ...subscriptionData, 
        refreshSubscription 
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}