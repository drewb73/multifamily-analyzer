// FILE LOCATION: /src/components/settings/DeleteAccountModal.tsx
// PURPOSE: Enhanced account deletion modal with text confirmation
// BATCH G - G11: Account Deletion Confirmation Modal

'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface DeleteAccountModalProps {
  subscriptionStatus: 'trial' | 'free' | 'premium' | 'enterprise'
  onDelete: () => Promise<void>
  onClose: () => void
}

export function DeleteAccountModal({ subscriptionStatus, onDelete, onClose }: DeleteAccountModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [understandChecked, setUnderstandChecked] = useState(false)
  
  const isPremium = subscriptionStatus === 'premium' || subscriptionStatus === 'enterprise'
  const isConfirmValid = understandChecked
  
  const handleDelete = async () => {
    if (isPremium) {
      return // Shouldn't happen, but safety check
    }
    
    if (!isConfirmValid) {
      setError('Please check the confirmation box to proceed')
      return
    }
    
    setIsDeleting(true)
    setError(null)
    
    try {
      await onDelete()
      // onDelete will handle redirect
    } catch (err: any) {
      setError(err.message || 'Failed to delete account')
      setIsDeleting(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
          disabled={isDeleting}
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Warning Icon */}
        <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-error-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-neutral-900 mb-2 text-center">
          Delete Account?
        </h2>
        
        {isPremium ? (
          // Premium users - cannot delete
          <>
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-warning-900 mb-1">
                    Active Premium Subscription
                  </h3>
                  <p className="text-sm text-warning-700 leading-relaxed">
                    You still have an active premium subscription. Please cancel your subscription and wait for it to expire before deleting your account. 
                    If cancelled before your next billing period, you will retain access for the duration of your current billing period but will not be automatically charged for the next billing period.
                  </p>
                  <p className="text-sm text-warning-700 mt-2">
                    Inactive free tier accounts can be automatically deleted after 60 days of inactivity.
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="btn-primary w-full"
            >
              Go Back
            </button>
          </>
        ) : (
          // Free/Trial users - can delete with enhanced confirmation
          <>
            <p className="text-neutral-600 mb-4 text-center leading-relaxed">
              This action will permanently delete your account and all associated data after 60 days.
            </p>
            
            {/* 60-Day Retention Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <span className="text-lg">📅</span>
                60-Day Data Retention
              </h3>
              <p className="text-sm text-blue-700 leading-relaxed">
                You will lose access to your account immediately, but your data will be kept for 60 days in case you change your mind. 
                After 60 days, everything will be permanently deleted.
              </p>
            </div>
            
            {/* What Happens */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">
                What happens:
              </h3>
              <ul className="text-sm text-neutral-600 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5"></span>
                  <span><strong>Immediate:</strong> You'll be logged out and lose access</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5"></span>
                  <span><strong>60 Days:</strong> Your data is kept (can be restored by support)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5"></span>
                  <span><strong>After 60 Days:</strong> Everything is permanently deleted</span>
                </li>
              </ul>
            </div>
            
            {/* Confirmation Checkbox */}
            <div className="mb-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={understandChecked}
                  onChange={(e) => {
                    setUnderstandChecked(e.target.checked)
                    if (error) setError(null)
                  }}
                  disabled={isDeleting}
                  className="mt-0.5 w-4 h-4 text-error-600 border-neutral-300 rounded focus:ring-error-500 focus:ring-2 cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="text-sm text-neutral-700 leading-relaxed group-hover:text-neutral-900 transition-colors">
                  I understand this action is <strong>permanent</strong> and my data will be deleted after 60 days
                </span>
              </label>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-error-50 border border-error-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-error-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error-700">{error}</p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg text-neutral-700 font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!isConfirmValid || isDeleting}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  isConfirmValid
                    ? 'bg-error-600 text-white hover:bg-error-700'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
            
            {/* Helper text */}
            {!isConfirmValid && (
              <p className="text-xs text-neutral-500 text-center mt-3">
                Check the box above to enable deletion
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}