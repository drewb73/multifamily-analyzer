// FILE LOCATION: /src/components/settings/AccountCard.tsx
// COMPLETE FILE with Team Member badge fix

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import { User, Crown, Clock, Trash2, Shield, Loader2, Calendar, AlertTriangle, CheckCircle, Users } from 'lucide-react'
import Link from 'next/link'
import { SubscriptionStatus, getSubscriptionBadge, getTrialHoursRemaining } from '@/lib/subscription'
import { ManageSubscriptionModal } from '@/components/subscription/ManageSubscriptionModal'
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal'
import { useSystemSettings } from '@/hooks/useSystemSettings'

interface AccountCardProps {
  isTeamMember?: boolean
  subscriptionStatus: SubscriptionStatus
  trialEndsAt: Date | null
  onRefresh?: () => void
}

export function AccountCard({ subscriptionStatus: initialSubscriptionStatus, trialEndsAt, isTeamMember = false, onRefresh }: AccountCardProps) {
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { settings: systemSettings } = useSystemSettings()
  
  // State management
  const [subscriptionStatus, setSubscriptionStatus] = useState(initialSubscriptionStatus)
  const [showManageModal, setShowManageModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<Date | null>(null)
  const [cancelledAt, setCancelledAt] = useState<Date | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Check if user is admin and fetch subscription data
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
    
    const fetchSubscriptionData = async () => {
      try {
        const response = await fetch('/api/subscription/status')
        if (response.ok) {
          const data = await response.json()
          
          if (data.subscription) {
            setSubscriptionEndsAt(
              data.subscription.subscriptionEndsAt 
                ? new Date(data.subscription.subscriptionEndsAt) 
                : null
            )
            setCancelledAt(
              data.subscription.cancelledAt 
                ? new Date(data.subscription.cancelledAt) 
                : null
            )
            if (data.subscription.status) {
              setSubscriptionStatus(data.subscription.status)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch subscription data:', error)
      }
    }
    
    if (user) {
      checkAdmin()
      fetchSubscriptionData()
    }
  }, [user])
  
  const badge = getSubscriptionBadge(subscriptionStatus, isTeamMember)
  const hoursRemaining = trialEndsAt ? getTrialHoursRemaining(trialEndsAt) : 0
  const showTrialExpiry = subscriptionStatus === 'trial' && hoursRemaining > 0
  const showUpgrade = !isTeamMember && subscriptionStatus !== 'premium' && subscriptionStatus !== 'enterprise'
  
  // Check if subscription is cancelled but still active
  const isCancelledButActive = cancelledAt && subscriptionEndsAt && new Date() < subscriptionEndsAt
  
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
  
  // Handle upgrade to premium with Stripe
  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error upgrading:', error)
      alert('Failed to start upgrade process. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle subscription cancellation
  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      if (data.cancelledAt) {
        setCancelledAt(new Date(data.cancelledAt))
      }
      if (data.subscriptionEndsAt) {
        setSubscriptionEndsAt(new Date(data.subscriptionEndsAt))
      }

      setShowManageModal(false)
      setSuccessMessage('Subscription cancelled. You\'ll have access until the end of your billing period.')
      
      if (onRefresh) {
        onRefresh()
      }
      router.refresh()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Failed to cancel subscription. Please try again.')
    } finally {
      setIsCancelling(false)
    }
  }
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/user/delete', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      await signOut()
      router.push('/?account=marked_for_deletion')
    } catch (error: any) {
      console.error('Error deleting account:', error)
      alert(error.message || 'Failed to delete account. Please try again.')
    }
  }
  
  return (
    <>
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">Account Information</h2>
          <div className="flex items-center gap-2">
            {isTeamMember && <Users className="w-5 h-5 text-primary-600" />}
            {!isTeamMember && subscriptionStatus === 'premium' && <Crown className="w-5 h-5 text-success-600" />}
            {!isTeamMember && subscriptionStatus === 'trial' && <Clock className="w-5 h-5 text-warning-600" />}
            {!isTeamMember && subscriptionStatus === 'enterprise' && <Shield className="w-5 h-5 text-primary-600" />}
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              badge.color === 'green' ? 'bg-success-100 text-success-800' :
              badge.color === 'blue' ? 'bg-primary-100 text-primary-800' :
              badge.color === 'purple' ? 'bg-purple-100 text-purple-800' :
              'bg-neutral-100 text-neutral-800'
            }`}>
              {badge.text}
            </span>
          </div>
        </div>
        
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-success-700">{successMessage}</p>
              <button 
                onClick={() => setSuccessMessage(null)} 
                className="text-xs text-success-600 hover:text-success-700 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        
        {/* Cancellation Notice - Persistent */}
        {isCancelledButActive && subscriptionEndsAt && (
          <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-warning-900">Subscription Cancelled</p>
                <p className="text-sm text-warning-700 mt-1">
                  You will have access to premium features until{' '}
                  <span className="font-semibold">
                    {subscriptionEndsAt.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Trial Expiry Notice */}
        {showTrialExpiry && (
          <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg flex items-start gap-3">
            <Clock className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning-900">Trial expires in:</p>
              <p className="text-lg font-bold text-warning-700">{formatTimeRemaining(hoursRemaining)}</p>
              <p className="text-xs text-warning-600 mt-1">
                Upgrade to Premium to keep full access
              </p>
            </div>
          </div>
        )}
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 text-neutral-700">
            <User className="w-5 h-5 text-primary-600" />
            <div>
              <p className="text-sm text-neutral-500">Name</p>
              <p className="font-medium">{user?.fullName || 'Not set'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-neutral-700">
            <span className="text-xl">📧</span>
            <div>
              <p className="text-sm text-neutral-500">Email</p>
              <p className="font-medium">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
          
          {subscriptionEndsAt && (
            <div className="flex items-center gap-3 text-neutral-700">
              <Calendar className="w-5 h-5 text-primary-600" />
              <div>
                <p className="text-sm text-neutral-500">
                  {isCancelledButActive ? 'Access Until' : 'Next Billing Date'}
                </p>
                <p className="font-medium">
                  {subscriptionEndsAt.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-6 border-t border-neutral-200">
          {/* Upgrade Button - Show if not premium and not team member */}
          {showUpgrade && (
            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  Upgrade to Premium
                </>
              )}
            </button>
          )}
          
          {/* Manage Subscription - Show if premium and NOT cancelled */}
          {subscriptionStatus === 'premium' && !isCancelledButActive && (
            <button
              onClick={() => setShowManageModal(true)}
              className="btn-secondary w-full"
            >
              Manage Subscription
            </button>
          )}
          
          {/* Already Cancelled - Show disabled button */}
          {subscriptionStatus === 'premium' && isCancelledButActive && (
            <button
              disabled
              className="btn-secondary w-full opacity-50 cursor-not-allowed"
            >
              Subscription Cancelled
            </button>
          )}
          
          {/* Admin Panel Link */}
          {isAdmin && (
            <Link 
              href="/nreadr" 
              className="btn-secondary w-full text-center"
            >
              Admin Panel
            </Link>
          )}
          
          {/* Delete Account */}
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={!systemSettings?.accountDeletionEnabled}
            className={`w-full flex items-center justify-center gap-2 ${
              systemSettings?.accountDeletionEnabled
                ? 'btn-outline-danger'
                : 'btn-outline-danger opacity-50 cursor-not-allowed'
            }`}
            title={
              !systemSettings?.accountDeletionEnabled
                ? 'Account deletion is currently disabled by administrator'
                : 'Delete your account permanently'
            }
          >
            <Trash2 className="w-5 h-5" />
            Delete Account
          </button>
          
          {/* Show message when deletion is disabled */}
          {!systemSettings?.accountDeletionEnabled && (
            <p className="text-xs text-neutral-500 text-center -mt-2">
              Account deletion is temporarily disabled
            </p>
          )}
        </div>
      </div>
      
      {/* Manage Subscription Modal */}
      {showManageModal && (
        <ManageSubscriptionModal
          subscriptionStatus={subscriptionStatus}
          subscriptionEndsAt={subscriptionEndsAt}
          onCancel={handleCancel}
          onClose={() => setShowManageModal(false)}
        />
      )}
      
      {/* Delete Account Modal */}
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