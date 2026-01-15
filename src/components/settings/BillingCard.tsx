// FILE LOCATION: /src/components/settings/BillingCard.tsx
// IMPROVEMENT: Show proper billing info for cancelled subscriptions

'use client'

import { useState } from 'react'
import { CreditCard, Calendar, Receipt, AlertTriangle } from 'lucide-react'
import { SubscriptionStatus } from '@/lib/subscription'
import { BillingHistoryModal } from './BillingHistoryModal'
import { useSystemSettings } from '@/hooks/useSystemSettings'

interface BillingCardProps {
  subscriptionStatus: SubscriptionStatus
  subscriptionEndsAt: Date | null // Next billing date OR expiration date (if cancelled)
  cancelledAt: Date | null // ✅ NEW: Track if subscription is cancelled
  billingHistory: Array<{
    id: string
    date: Date
    amount: number
    status: 'paid' | 'pending' | 'failed'
    description: string
  }>
}

export function BillingCard({ 
  subscriptionStatus, 
  subscriptionEndsAt, 
  cancelledAt, // ✅ NEW
  billingHistory 
}: BillingCardProps) {
  const [showHistory, setShowHistory] = useState(false)
  const { settings } = useSystemSettings()
  
  // Hide if Stripe disabled
  if (!settings?.stripeEnabled) {
    return null
  }
  
  // ✅ NEW: Check if subscription is cancelled but still active
  const isCancelledButActive = cancelledAt && subscriptionEndsAt && new Date() < subscriptionEndsAt
  
  // Format next billing/expiration date
  const getNextBillingDate = () => {
    if (!subscriptionEndsAt || subscriptionStatus !== 'premium') {
      return 'N/A'
    }
    
    const date = new Date(subscriptionEndsAt)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  // Calculate days until next billing/expiration
  const getDaysUntilBilling = () => {
    if (!subscriptionEndsAt || subscriptionStatus !== 'premium') {
      return null
    }

    const now = new Date()
    const end = new Date(subscriptionEndsAt)
    const diffMs = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }
  
  // ✅ UPDATED: Show "Premium - Cancelled" if cancelled
  const getPlanDisplay = () => {
    switch (subscriptionStatus) {
      case 'premium':
        return isCancelledButActive ? 'Premium - Cancelled' : 'Premium - $7/month'
      case 'enterprise':
        return 'Enterprise - Custom'
      case 'trial':
        return 'Free Trial'
      default:
        return 'Free Plan'
    }
  }

  const daysRemaining = getDaysUntilBilling()
  const showBillingInfo = subscriptionStatus === 'premium' || subscriptionStatus === 'enterprise'
  
  return (
    <>
      <div className="elevated-card p-6">
        <div className="flex items-center mb-6">
          <CreditCard className="h-6 w-6 text-success-600 mr-3" />
          <h2 className="text-xl font-semibold text-neutral-800">
            Billing
          </h2>
        </div>
        
        {/* ✅ NEW: Cancellation Warning */}
        {isCancelledButActive && (
          <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-warning-900">Subscription Cancelled</p>
                <p className="text-sm text-warning-700 mt-1">
                  No further charges will be made. Your premium access continues until the expiration date below.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {/* Current Plan */}
          <div>
            <div className="text-sm text-neutral-500 mb-2">Current Plan</div>
            <div className="font-medium text-neutral-900">{getPlanDisplay()}</div>
          </div>
          
          {/* ✅ UPDATED: Show "Subscription Expiration Date" if cancelled */}
          <div>
            <div className="text-sm text-neutral-500 mb-2">
              {isCancelledButActive ? 'Subscription Expiration Date' : 'Next Billing Date'}
            </div>
            <div className="text-neutral-900">
              {showBillingInfo ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-500" />
                    <span className="font-medium">{getNextBillingDate()}</span>
                  </div>
                  {daysRemaining !== null && daysRemaining > 0 && (
                    <p className="text-xs text-neutral-600 ml-6">
                      {isCancelledButActive 
                        ? `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} of premium access remaining`
                        : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining in billing period`
                      }
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-neutral-600">
                  {subscriptionStatus === 'trial' ? 'After trial ends' : 'Upgrade to see billing dates'}
                </span>
              )}
            </div>
          </div>

          {/* ✅ UPDATED: Show $0.00 if cancelled */}
          {showBillingInfo && (
            <div>
              <div className="text-sm text-neutral-500 mb-2">Next Charge</div>
              <div className="font-medium text-neutral-900">
                {isCancelledButActive ? (
                  <>
                    <span className="line-through text-neutral-400 mr-2">$7.00</span>
                    <span className="text-success-600">$0.00 USD</span>
                  </>
                ) : (
                  '$7.00 USD'
                )}
              </div>
              <p className="text-xs text-neutral-600 mt-1">
                {isCancelledButActive ? (
                  'No further charges will be made'
                ) : (
                  <>
                    Charged monthly on the {subscriptionEndsAt ? new Date(subscriptionEndsAt).getDate() : 'N/A'}
                    {getOrdinalSuffix(subscriptionEndsAt ? new Date(subscriptionEndsAt).getDate() : 1)} of each month
                  </>
                )}
              </p>
            </div>
          )}
          
          {/* Billing History Button */}
          <div className="pt-2">
            <button
              onClick={() => setShowHistory(true)}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-neutral-700 font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
              disabled={!showBillingInfo}
            >
              <Receipt className="w-4 h-4" />
              View Billing History
            </button>
            {!showBillingInfo && (
              <p className="text-xs text-center text-neutral-500 mt-2">
                Billing history available after subscribing to Premium
              </p>
            )}
          </div>
          
          {/* Payment Method - Placeholder for Stripe integration */}
          {showBillingInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">💡 Demo Mode</p>
                <p>
                  Payment methods will be managed through Stripe when billing is enabled. 
                  You'll be able to update your card, view invoices, and manage payment details.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Billing History Modal */}
      <BillingHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        billingHistory={billingHistory}
      />
    </>
  )
}

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th'
  }
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}