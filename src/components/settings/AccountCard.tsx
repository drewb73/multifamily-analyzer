// src/components/settings/AccountCard.tsx
'use client'

import { User, Crown, Clock } from 'lucide-react'
import { SubscriptionStatus, getSubscriptionBadge, getTrialHoursRemaining } from '@/lib/subscription'
import Link from 'next/link'

interface AccountCardProps {
  subscriptionStatus: SubscriptionStatus
  trialEndsAt: Date | null
  onUpgrade?: () => void
}

export function AccountCard({ subscriptionStatus, trialEndsAt, onUpgrade }: AccountCardProps) {
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
  
  return (
    <div className="elevated-card p-6">
      <div className="flex items-center mb-6">
        <User className="h-6 w-6 text-primary-600 mr-3" />
        <h2 className="text-xl font-semibold text-neutral-800">
          Account Information
        </h2>
      </div>
      
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
            {onUpgrade ? (
              <button
                onClick={onUpgrade}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Premium
              </button>
            ) : (
              <Link
                href="/pricing"
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Premium
              </Link>
            )}
            <p className="text-xs text-center text-neutral-500 mt-2">
              Get unlimited analyses, saved properties, and PDF exports
            </p>
          </div>
        )}
        
        {/* Premium Benefits - Show for premium users */}
        {!showUpgrade && (
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
        )}
      </div>
    </div>
  )
}