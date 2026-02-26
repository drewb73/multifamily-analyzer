// FILE LOCATION: /src/components/settings/BillingCard.tsx
// COMPLETE FILE - Replace entire file
// FIXED: ALL hooks MUST be called before ANY early returns

'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Calendar, Receipt, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { SubscriptionStatus } from '@/lib/subscription'
import { BillingHistoryModal } from './BillingHistoryModal'
import { useSystemSettings } from '@/hooks/useSystemSettings'

interface BillingCardProps {
  subscriptionStatus: SubscriptionStatus
  subscriptionSource: string | null
  subscriptionEndsAt: Date | null
  cancelledAt: Date | null
  billingHistory: Array<{
    id: string
    date: Date
    amount: number
    status: 'paid' | 'pending' | 'failed'
    description: string
  }>
}

interface SubscriptionLineItem {
  id: string
  quantity: number
  price: {
    unitAmount: number
    currency: string
  }
  product: {
    name: string
    description: string | null
  }
}

interface StripeSubscription {
  id: string
  status: string
  currentPeriodEnd: number
  cancelAtPeriodEnd: boolean
  items: SubscriptionLineItem[]
  totalAmount: number
}

export function BillingCard({ 
  subscriptionStatus, 
  subscriptionSource,
  subscriptionEndsAt, 
  cancelledAt,
  billingHistory 
}: BillingCardProps) {
  // ✅ CRITICAL: ALL hooks must be called FIRST, before ANY returns
  const [showHistory, setShowHistory] = useState(false)
  const { settings } = useSystemSettings()
  const [stripeSubscription, setStripeSubscription] = useState<StripeSubscription | null>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(true)
  
  // ✅ useEffect MUST come before ANY conditional returns
  useEffect(() => {
    async function fetchSubscriptionDetails() {
      // Only fetch for Stripe subscriptions
      if (subscriptionSource === 'manual' || subscriptionStatus === 'free' || subscriptionStatus === 'trial') {
        setLoadingSubscription(false)
        return
      }

      try {
        const response = await fetch('/api/billing/subscription')
        if (response.ok) {
          const data = await response.json()
          if (data.subscription) {
            setStripeSubscription(data.subscription)
          }
        }
      } catch (error) {
        console.error('Failed to fetch subscription details:', error)
      } finally {
        setLoadingSubscription(false)
      }
    }

    fetchSubscriptionDetails()
  }, [subscriptionSource, subscriptionStatus])
  
  // ✅ NOW we can do early returns (after all hooks are called)
  const isManualSubscription = subscriptionSource === 'manual'
  
  // Hide if Stripe disabled
  if (!settings?.stripeEnabled) {
    return null
  }
  
  // Special display for manual subscriptions
  if (isManualSubscription && (subscriptionStatus === 'premium' || subscriptionStatus === 'enterprise')) {
    return (
      <div className="elevated-card p-6">
        <div className="flex items-center mb-6">
          <CreditCard className="h-6 w-6 text-success-600 mr-3" />
          <h2 className="text-xl font-semibold text-neutral-800">
            Billing
          </h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-success-900">Manual Premium Access</p>
                <p className="text-sm text-success-700 mt-1">
                  Your account has been granted premium access by an administrator. No billing charges apply.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-neutral-500 mb-2">Current Plan</div>
            <div className="font-medium text-neutral-900">
              {subscriptionStatus === 'enterprise' ? 'Enterprise - Complimentary' : 'Premium - Complimentary'}
            </div>
          </div>

          <div>
            <div className="text-sm text-neutral-500 mb-2">Monthly Cost</div>
            <div className="font-medium text-neutral-900">$0.00 USD</div>
            <p className="text-xs text-neutral-600 mt-1">
              No charges - Administrative grant
            </p>
          </div>

          {subscriptionEndsAt && (
            <div>
              <div className="text-sm text-neutral-500 mb-2">Access Valid Until</div>
              <div className="text-neutral-900">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neutral-500" />
                  <span className="font-medium">
                    {new Date(subscriptionEndsAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // Stripe subscription display with line items
  const isCancelledButActive = cancelledAt && subscriptionEndsAt && new Date() < subscriptionEndsAt
  
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
  
  const getPlanDisplay = () => {
    switch (subscriptionStatus) {
      case 'premium':
        return isCancelledButActive ? 'Premium - Cancelled' : 'Premium'
      case 'enterprise':
        return 'Enterprise'
      case 'trial':
        return 'Free Trial'
      default:
        return 'Free Plan'
    }
  }

  const daysRemaining = getDaysUntilBilling()
  const showBillingInfo = subscriptionStatus === 'premium' || subscriptionStatus === 'enterprise'
  
  // Format currency
  const formatCurrency = (amountInCents: number) => {
    return `$${(amountInCents / 100).toFixed(2)}`
  }
  
  return (
    <>
      <div className="elevated-card p-6">
        <div className="flex items-center mb-6">
          <CreditCard className="h-6 w-6 text-success-600 mr-3" />
          <h2 className="text-xl font-semibold text-neutral-800">
            Billing
          </h2>
        </div>
        
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
          
          {/* Subscription Line Items (Base + Seats) */}
          {showBillingInfo && stripeSubscription && !loadingSubscription && (
            <div>
              <div className="text-sm text-neutral-500 mb-3">Subscription Details</div>
              <div className="space-y-2 bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                {stripeSubscription.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-neutral-700">
                      {item.product.name}
                      {item.quantity > 1 && (
                        <span className="text-neutral-500 ml-1">× {item.quantity}</span>
                      )}
                    </span>
                    <span className="font-medium text-neutral-900">
                      {formatCurrency(item.price.unitAmount * item.quantity)}/mo
                    </span>
                  </div>
                ))}
                
                {stripeSubscription.items.length > 1 && (
                  <div className="flex justify-between text-sm pt-2 border-t border-neutral-300 font-semibold">
                    <span className="text-neutral-900">Total</span>
                    <span className="text-neutral-900">
                      {formatCurrency(stripeSubscription.totalAmount)}/mo
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Loading state */}
          {showBillingInfo && loadingSubscription && (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading subscription details...</span>
            </div>
          )}
          
          {/* Next Billing Date */}
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

          {/* Next Charge */}
          {showBillingInfo && stripeSubscription && !loadingSubscription && (
            <div>
              <div className="text-sm text-neutral-500 mb-2">Next Charge</div>
              <div className="text-neutral-900">
                <div className="font-medium">
                  {isCancelledButActive 
                    ? '$0.00 USD' 
                    : `${formatCurrency(stripeSubscription.totalAmount)} USD`
                  }
                </div>
                <p className="text-xs text-neutral-600 mt-1">
                  {isCancelledButActive 
                    ? 'Subscription will not renew'
                    : `Charged monthly on the ${new Date(subscriptionEndsAt || Date.now()).getDate()}${getOrdinalSuffix(new Date(subscriptionEndsAt || Date.now()).getDate())} of each month`
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {billingHistory.length > 0 && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <Receipt className="w-4 h-4 mr-2" />
              View Billing History
            </button>
          </div>
        )}
      </div>

      <BillingHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        billingHistory={billingHistory}
      />
    </>
  )
}

// Helper function for ordinal suffixes (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}