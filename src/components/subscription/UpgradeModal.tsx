// FILE 6 of 8: REPLACE ENTIRE FILE
// Location: src/components/subscription/UpgradeModal.tsx
// Action: REPLACE YOUR ENTIRE UpgradeModal.tsx WITH THIS

'use client'

import { useState } from 'react'
import { X, Crown, Check, Loader2, CreditCard } from 'lucide-react'
import { SubscriptionStatus } from '@/lib/subscription'
import { useSystemSettings } from '@/hooks/useSystemSettings'

interface UpgradeModalProps {
  currentStatus: SubscriptionStatus
  trialHoursRemaining?: number
  onUpgrade: () => Promise<void>
  onClose: () => void
}

export function UpgradeModal({ 
  currentStatus, 
  trialHoursRemaining = 0,
  onUpgrade, 
  onClose 
}: UpgradeModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { settings } = useSystemSettings()

  const handleUpgrade = async () => {
    setIsUpgrading(true)
    setError(null)
    
    try {
      await onUpgrade()
      // Success - modal will close via parent component
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade. Please try again.')
      setIsUpgrading(false)
    }
  }

  const formatTimeRemaining = (hours: number) => {
    if (hours < 1) return 'less than 1 hour'
    if (hours === 1) return '1 hour'
    if (hours < 24) return `${hours} hours`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    if (remainingHours === 0) return `${days} ${days === 1 ? 'day' : 'days'}`
    return `${days} ${days === 1 ? 'day' : 'days'}, ${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-neutral-900">
                Upgrade to Premium
              </h2>
              <p className="text-sm text-neutral-500">
                Unlock unlimited access to all features
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUpgrading}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Check if Stripe is enabled */}
          {!settings?.stripeEnabled ? (
            <>
              {/* Maintenance Message */}
              <div className="text-center py-8">
                <CreditCard className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Upgrades Temporarily Unavailable
                </h3>
                <p className="text-neutral-600 mb-4">
                  Our payment system is currently under maintenance. Please try again later.
                </p>
                <button 
                  onClick={onClose} 
                  className="btn-secondary px-6 py-2"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Current Status */}
              {currentStatus === 'trial' && trialHoursRemaining > 0 && (
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center flex-shrink-0">
                      ⏰
                    </div>
                    <div>
                      <h3 className="font-semibold text-warning-900">Trial Active</h3>
                      <p className="text-sm text-warning-700 mt-1">
                        You have <strong>{formatTimeRemaining(trialHoursRemaining)}</strong> remaining in your trial.
                        Upgrade now to keep all your data and continue without interruption.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStatus === 'free' && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                      ℹ️
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">Free Account</h3>
                      <p className="text-sm text-neutral-600 mt-1">
                        Your trial has ended. Upgrade to Premium to save unlimited analyses and export PDFs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200 rounded-xl p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-neutral-900">$9.99</span>
                    <span className="text-xl text-neutral-600">/month</span>
                  </div>
                  <p className="text-sm text-neutral-600 mt-2">
                    Cancel anytime • No hidden fees
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-success-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">Unlimited Property Analyses</p>
                      <p className="text-sm text-neutral-600">Create and analyze as many properties as you need</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-success-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">Save Unlimited Analyses</p>
                      <p className="text-sm text-neutral-600">Store all your property data in the cloud</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-success-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">Organize with Groups</p>
                      <p className="text-sm text-neutral-600">Create custom groups to organize properties</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-success-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">Professional PDF Exports</p>
                      <p className="text-sm text-neutral-600">Export beautiful, branded PDF reports</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-success-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">Custom Branding</p>
                      <p className="text-sm text-neutral-600">Add your logo and colors to reports</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-success-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">Priority Support</p>
                      <p className="text-sm text-neutral-600">Get help when you need it</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Demo Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    💡
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Demo Mode</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Payment integration is not yet active. Clicking "Upgrade" will instantly activate your Premium account for testing purposes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isUpgrading}
                  className="btn-secondary flex-1 py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                >
                  {isUpgrading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5" />
                      Upgrade to Premium
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-center text-neutral-500">
                By upgrading, you agree to our Terms of Service and Privacy Policy
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}