// src/components/subscription/ManageSubscriptionModal.tsx
'use client'

import { useState } from 'react'
import { X, Crown, AlertTriangle, Loader2, Check } from 'lucide-react'
import { SubscriptionStatus } from '@/lib/subscription'

interface ManageSubscriptionModalProps {
  subscriptionStatus: SubscriptionStatus
  onCancel: () => Promise<void>
  onClose: () => void
}

export function ManageSubscriptionModal({ 
  subscriptionStatus,
  onCancel, 
  onClose 
}: ManageSubscriptionModalProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCancelClick = () => {
    setShowCancelConfirm(true)
  }

  const handleConfirmCancel = async () => {
    setIsCancelling(true)
    setError(null)
    
    try {
      await onCancel()
      // Success - modal will close via parent component
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription. Please try again.')
      setIsCancelling(false)
      setShowCancelConfirm(false)
    }
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
                Manage Subscription
              </h2>
              <p className="text-sm text-neutral-500">
                Your Premium membership
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isCancelling}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Plan */}
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-primary-600" />
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">Premium Plan</h3>
                  <p className="text-sm text-neutral-600">Active subscription</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-neutral-900">$7</div>
                <div className="text-sm text-neutral-600">per month</div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-primary-200">
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                <Check className="w-4 h-4 text-success-600" />
                <span>Unlimited property analyses</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                <Check className="w-4 h-4 text-success-600" />
                <span>Save unlimited analyses</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                <Check className="w-4 h-4 text-success-600" />
                <span>Organize with groups</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                <Check className="w-4 h-4 text-success-600" />
                <span>Professional PDF exports</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                <Check className="w-4 h-4 text-success-600" />
                <span>Custom branding</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                <Check className="w-4 h-4 text-success-600" />
                <span>Priority support</span>
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
                  Payment integration is not yet active. In production, you would keep premium access until the end of your billing period after cancelling.
                </p>
              </div>
            </div>
          </div>

          {/* Cancel Confirmation */}
          {showCancelConfirm && (
            <div className="bg-error-50 border-2 border-error-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-error-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-error-600" />
                </div>
                <div>
                  <h3 className="font-bold text-error-900 text-lg mb-2">
                    Cancel Premium Subscription?
                  </h3>
                  <p className="text-sm text-error-700">
                    Are you sure you want to cancel? You'll lose access to:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-error-700">
                    <li>• Saving unlimited analyses</li>
                    <li>• Organizing with groups</li>
                    <li>• PDF export functionality</li>
                    <li>• Custom branding options</li>
                    <li>• Priority support</li>
                  </ul>
                  <p className="text-sm text-error-700 mt-3 font-medium">
                    Your saved data will be preserved, but you won't be able to create new analyses or exports.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isCancelling}
                  className="btn-secondary flex-1 py-2.5"
                >
                  Keep Premium
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="bg-error-600 hover:bg-error-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 flex-1"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Yes, Cancel Subscription'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4">
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          {!showCancelConfirm && (
            <div className="space-y-3">
              <button
                onClick={handleCancelClick}
                disabled={isCancelling}
                className="w-full py-3 px-4 border-2 border-error-300 text-error-700 hover:bg-error-50 font-medium rounded-lg transition-colors"
              >
                Cancel Subscription
              </button>
              
              <button
                onClick={onClose}
                disabled={isCancelling}
                className="btn-secondary w-full py-3"
              >
                Close
              </button>
            </div>
          )}

          <p className="text-xs text-center text-neutral-500">
            Questions? Contact our support team at support@propertyanalyzer.com
          </p>
        </div>
      </div>
    </div>
  )
}