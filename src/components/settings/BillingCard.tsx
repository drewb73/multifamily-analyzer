// src/components/settings/BillingCard.tsx
'use client'

import { useState } from 'react'
import { CreditCard, Calendar, Receipt } from 'lucide-react'
import { SubscriptionStatus } from '@/lib/subscription'
import { BillingHistoryModal } from './BillingHistoryModal'

interface BillingCardProps {
  subscriptionStatus: SubscriptionStatus
  subscriptionDate: Date | null
  billingHistory: Array<{
    id: string
    date: Date
    amount: number
    status: 'paid' | 'pending' | 'failed'
    description: string
  }>
}

export function BillingCard({ subscriptionStatus, subscriptionDate, billingHistory }: BillingCardProps) {
  const [showHistory, setShowHistory] = useState(false)
  
  // Calculate next billing date (30 days from subscription date)
  const getNextBillingDate = () => {
    if (!subscriptionDate || subscriptionStatus !== 'premium') {
      return 'N/A'
    }
    
    const next = new Date(subscriptionDate)
    next.setDate(next.getDate() + 30)
    
    return next.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }
  
  const getPlanDisplay = () => {
    switch (subscriptionStatus) {
      case 'premium':
        return 'Premium - $29/month'
      case 'enterprise':
        return 'Enterprise - Custom'
      case 'trial':
        return 'Free Trial'
      default:
        return 'Free Plan'
    }
  }
  
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
        
        <div className="space-y-4">
          {/* Current Plan */}
          <div>
            <div className="text-sm text-neutral-500 mb-2">Current Plan</div>
            <div className="font-medium text-neutral-900">{getPlanDisplay()}</div>
          </div>
          
          {/* Next Billing Date */}
          <div>
            <div className="text-sm text-neutral-500 mb-2">Next Billing Date</div>
            <div className="flex items-center gap-2 text-neutral-900">
              {showBillingInfo ? (
                <>
                  <Calendar className="w-4 h-4 text-neutral-500" />
                  <span className="font-medium">{getNextBillingDate()}</span>
                </>
              ) : (
                <span className="text-neutral-600">
                  {subscriptionStatus === 'trial' ? 'After trial ends' : 'Upgrade to see billing dates'}
                </span>
              )}
            </div>
          </div>
          
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
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 mt-4">
              <div className="text-xs text-neutral-600">
                <p className="font-medium mb-1">Payment Method</p>
                <p>
                  Payment methods will be managed through Stripe when billing is enabled.
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