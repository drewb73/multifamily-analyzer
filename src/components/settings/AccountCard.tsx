// src/components/settings/AccountCard.tsx
// FIX 3: Upgrade button now goes to Stripe checkout
// FULLY CORRECTED: Fixed all modal props
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import { User, Crown, Clock, Trash2, Shield, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { SubscriptionStatus, getSubscriptionBadge, getTrialHoursRemaining } from '@/lib/subscription'
import { ManageSubscriptionModal } from '@/components/subscription/ManageSubscriptionModal'
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal'
import { useSystemSettings } from '@/hooks/useSystemSettings'

interface AccountCardProps {
  subscriptionStatus: SubscriptionStatus
  trialEndsAt: Date | null
  onRefresh?: () => void
}

export function AccountCard({ subscriptionStatus, trialEndsAt, onRefresh }: AccountCardProps) {
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { settings: systemSettings } = useSystemSettings()
  const [showManageModal, setShowManageModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<Date | null>(null)

  // Check if user is admin and fetch subscription end date
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/nreadr/check-status')
        const data = await response.json()
        setIsAdmin(data.isAdmin || false)
      } catch (error) {
        setIsAdmin(false)
      }
    }
    
    const fetchSubscriptionEndDate = async () => {
      try {
        const response = await fetch('/api/subscription/status')
        if (response.ok) {
          const data = await response.json()
          setSubscriptionEndsAt(data.subscriptionEndsAt ? new Date(data.subscriptionEndsAt) : null)
        }
      } catch (error) {
        console.error('Failed to fetch subscription end date:', error)
      }
    }
    
    if (user) {
      checkAdmin()
      fetchSubscriptionEndDate()
    }
  }, [user])
  
  const badge = getSubscriptionBadge(subscriptionStatus)
  const hoursRemaining = trialEndsAt ? getTrialHoursRemaining(trialEndsAt) : 0
  const showTrialExpiry = subscriptionStatus === 'trial' && hoursRemaining > 0
  const showUpgrade = subscriptionStatus !== 'premium' && subscriptionStatus !== 'enterprise'
  
  // Format hours remaining
  const formatTimeRemaining = (hours: number) => {
    if (hours < 1) return 'Less than 1 hour'
    if (hours === 1) return '1 hour'
    if (hours < 24) return `${hours} hours`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    if (remainingHours === 0) return `${days} ${days === 1 ? 'day' : 'days'}`
    return `${days} ${days === 1 ? 'day' : 'days'}, ${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'}`
  }
  
  // FIX 3: Handle upgrade to premium with Stripe
  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start checkout')
      }
      
      const { url } = await response.json()
      
      // Redirect to Stripe Checkout
      window.location.href = url
      
    } catch (error: any) {
      console.error('Upgrade error:', error)
      alert(error.message || 'Failed to start checkout. Please try again.')
      setIsLoading(false)
    }
  }
  
  // Handle subscription management (cancel, etc)
  const handleManageSubscription = () => {
    setShowManageModal(true)
  }
  
  // Handle cancel subscription (FIX 4: Uses cancel_at_period_end)
  const handleCancel = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }
      
      setSuccessMessage(data.message || 'Subscription cancelled successfully')
      setShowManageModal(false)
      
      // Refresh the router to update sidebar (server component will re-fetch)
      router.refresh()
      
      if (onRefresh) {
        setTimeout(() => {
          onRefresh()
          setSuccessMessage(null)
        }, 3000)
      }
      
    } catch (error: any) {
      console.error('Cancel error:', error)
      throw error // Let modal handle the error display
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user) return
    
    try {
      // Mark account for deletion (soft delete)
      const response = await fetch('/api/user/delete', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to mark account for deletion')
      }

      // Sign out user (do NOT delete from Clerk - that happens after 60 days via cron)
      await signOut()
      
      // Redirect to homepage with message
      router.push('/?account=marked_for_deletion')
    } catch (error: any) {
      console.error('Delete account error:', error)
      throw new Error('Failed to delete account. Please try again.')
    }
  }
  
  return (
    <>
      <div className="elevated-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              Account Information
            </h2>
            <p className="text-sm text-neutral-600">
              Manage your subscription and account
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Email */}
          <div className="pb-4 border-b border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Email Address</p>
                <p className="text-neutral-900 font-medium">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="pb-4 border-b border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-2">Subscription Status</p>
                <div className="flex items-center gap-2">
                  {/* Render icon manually based on status */}
                  {subscriptionStatus === 'premium' && <Crown className="w-5 h-5 text-success-600" />}
                  {subscriptionStatus === 'trial' && <Clock className="w-5 h-5 text-warning-600" />}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                    {badge.text}
                  </span>
                </div>
              </div>
              {showTrialExpiry && (
                <div className="text-right">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {formatTimeRemaining(hoursRemaining)} left
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upgrade Button */}
          {showUpgrade && systemSettings?.stripeEnabled && (
            <div className="pt-2">
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    Upgrade to Premium
                  </>
                )}
              </button>
              <p className="text-xs text-center text-neutral-500 mt-2">
                $7/month • Cancel anytime
              </p>
            </div>
          )}

          {/* Manage Subscription Button (for premium users) */}
          {!showUpgrade && systemSettings?.stripeEnabled && (
            <div className="pt-2">
              <button
                onClick={handleManageSubscription}
                className="w-full py-3 px-4 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
              >
                Manage Subscription
              </button>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700 text-center">
                {successMessage}
              </p>
            </div>
          )}

          {/* Admin Badge */}
          {isAdmin && (
            <div className="pt-2">
              <Link
                href="/nreadr"
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors text-sm font-medium"
              >
                <Shield className="w-4 h-4" />
                Admin Panel Access
              </Link>
            </div>
          )}

          {/* Delete Account (Danger Zone) */}
          <div className="pt-4 border-t border-neutral-200">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-2.5 px-4 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
            <p className="text-xs text-center text-neutral-500 mt-2">
              This action cannot be undone
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* FIXED: Pass all required props to ManageSubscriptionModal */}
      {showManageModal && (
        <ManageSubscriptionModal
          subscriptionStatus={subscriptionStatus}
          subscriptionEndsAt={subscriptionEndsAt}
          onCancel={handleCancel}
          onClose={() => {
            setShowManageModal(false)
            if (onRefresh) {
              onRefresh()
            }
          }}
        />
      )}
      
      {/* FIXED: Pass all required props to DeleteAccountModal */}
      {showDeleteModal && (
        <DeleteAccountModal
          subscriptionStatus={subscriptionStatus}
          onDelete={handleDeleteAccount}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </>
  )
}