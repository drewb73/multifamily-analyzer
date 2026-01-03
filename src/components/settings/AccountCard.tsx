// src/components/settings/AccountCard.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import { User, Crown, Clock, Trash2, Shield } from 'lucide-react'
import Link from 'next/link'
import { SubscriptionStatus, getSubscriptionBadge, getTrialHoursRemaining } from '@/lib/subscription'
import { UpgradeModal } from '@/components/subscription/UpgradeModal'
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/admin/check-status')
        const data = await response.json()
        setIsAdmin(data.isAdmin || false)
      } catch (error) {
        setIsAdmin(false)
      }
    }
    if (user) {
      checkAdmin()
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
  
  // Handle upgrade to premium
  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'premium' })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade')
      }
      
      setSuccessMessage('🎉 Successfully upgraded to Premium!')
      setShowUpgradeModal(false)
      
      // Refresh the router to update sidebar (server component will re-fetch)
      router.refresh()
      
      if (onRefresh) {
        setTimeout(() => {
          onRefresh()
          setSuccessMessage(null)
        }, 2000)
      }
      
    } catch (error: any) {
      console.error('Upgrade error:', error)
      throw error // Let modal handle the error display
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle cancel subscription
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
      
      setSuccessMessage('Subscription cancelled successfully')
      setShowManageModal(false)
      
      // Refresh the router to update sidebar (server component will re-fetch)
      router.refresh()
      
      if (onRefresh) {
        setTimeout(() => {
          onRefresh()
          setSuccessMessage(null)
        }, 2000)
      }
      
    } catch (error: any) {
      console.error('Cancel error:', error)
      throw error // Let modal handle the error display
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle delete account
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
        <div className="flex items-center mb-6">
          <User className="h-6 w-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-neutral-800">
            Account Information
          </h2>
        </div>
        
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-success-50 border border-success-200 rounded-lg p-3">
            <p className="text-sm text-success-700 font-medium">{successMessage}</p>
          </div>
        )}
        
        <div className="space-y-4">
          {/* Account Type */}
          <div>
            <div className="text-sm text-neutral-500 mb-2">Account Type</div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                {subscriptionStatus === 'premium' && <Crown className="w-4 h-4 mr-1" />}
                {badge.text}
              </span>
            </div>
          </div>

          {/* Admin Console Access - Only visible to admins */}
          {isAdmin && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary-600" />
                  <div>
                    <h3 className="text-sm font-semibold text-primary-900">Admin Access</h3>
                    <p className="text-xs text-primary-700">Manage users, features, and settings</p>
                  </div>
                </div>
                <Link 
                  href="/admin"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Open Console
                </Link>
              </div>
            </div>
          )}
          
          {/* Trial Expires - Only show for trial users */}
          {showTrialExpiry && (
            <div>
              <div className="text-sm text-neutral-500 mb-2">Trial Expires In</div>
              <div className="flex items-center gap-2 text-neutral-900">
                <Clock className="w-4 h-4 text-warning-600" />
                <span className="font-medium">{formatTimeRemaining(hoursRemaining)}</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Upgrade to Premium before your trial ends to keep all features
              </p>
            </div>
          )}
          
          {/* Upgrade Button - Show for non-premium users */}
          {showUpgrade && (
            <div className="pt-2">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Premium
              </button>
              <p className="text-xs text-center text-neutral-500 mt-2">
                Get unlimited analyses, saved properties, and PDF exports for just $7/month
              </p>
            </div>
          )}
          
          {/* Manage Subscription - Show for premium users */}
          {!showUpgrade && (
            <>
              <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Crown className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-success-900 mb-1">
                      Premium Member
                    </h3>
                    <p className="text-xs text-success-700">
                      You have access to all features including unlimited analyses, saved properties, and PDF exports.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <button
                  onClick={() => setShowManageModal(true)}
                  className="btn-secondary w-full py-3"
                >
                  Manage Subscription
                </button>
              </div>
            </>
          )}
          
          {/* Delete Account Button - Always visible but behavior differs */}
          <div className="pt-4 border-t border-neutral-200">
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={!systemSettings?.accountDeletionEnabled}
              className={`w-full py-3 px-4 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                !systemSettings?.accountDeletionEnabled
                  ? 'text-neutral-400 bg-neutral-100 cursor-not-allowed'
                  : 'text-error-600 hover:text-error-700 hover:bg-error-50'
              }`}
              title={!systemSettings?.accountDeletionEnabled ? 'Account deletion is temporarily disabled' : ''}
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
              {!systemSettings?.accountDeletionEnabled && (
                <span className="text-xs ml-2">(Disabled)</span>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          currentStatus={subscriptionStatus}
          trialHoursRemaining={hoursRemaining}
          onUpgrade={handleUpgrade}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
      
      {/* Manage Subscription Modal */}
      {showManageModal && (
        <ManageSubscriptionModal
          subscriptionStatus={subscriptionStatus}
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