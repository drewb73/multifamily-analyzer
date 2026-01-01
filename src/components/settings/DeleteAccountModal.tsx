// src/components/settings/DeleteAccountModal.tsx
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
  
  const isPremium = subscriptionStatus === 'premium' || subscriptionStatus === 'enterprise'
  
  const handleDelete = async () => {
    if (isPremium) {
      return // Shouldn't happen, but safety check
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
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
                  <p className="text-sm text-warning-700">
                    Please cancel your Premium subscription before deleting your account. 
                    You can cancel from the "Manage Subscription" button below.
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
          // Free/Trial users - can delete
          <>
            <p className="text-neutral-600 mb-6 text-center">
              Are you sure you want to delete your account? 
              <span className="block mt-2 font-semibold text-error-600">
                This action cannot be reversed.
              </span>
            </p>
            
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">
                You will lose:
              </h3>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• Your account and profile information</li>
                <li>• All saved properties and analyses</li>
                <li>• Any remaining trial time</li>
                <li>• Access to the dashboard</li>
              </ul>
            </div>
            
            {error && (
              <div className="mb-4 bg-error-50 border border-error-200 rounded-lg p-3">
                <p className="text-sm text-error-700">{error}</p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-error-600 text-white rounded-lg font-semibold hover:bg-error-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isDeleting}
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
          </>
        )}
      </div>
    </div>
  )
}