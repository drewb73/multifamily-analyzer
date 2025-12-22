// src/components/dashboard/DeleteConfirmModal.tsx
'use client'

import { AlertTriangle, X } from 'lucide-react'
import { useEffect } from 'react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  propertyAddress?: string
  confirmButtonText?: string
  cancelButtonText?: string
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Analysis",
  message = "Are you sure you want to delete this analysis? This action cannot be undone.",
  propertyAddress,
  confirmButtonText = "Delete",
  cancelButtonText = "Cancel"
}: DeleteConfirmModalProps) {
  
  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-md w-full pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex items-start gap-4">
              {/* Warning Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-error-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-error-600" />
              </div>
              
              {/* Title */}
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  {title}
                </h2>
                {propertyAddress && (
                  <p className="text-sm text-neutral-500 mt-1">
                    {propertyAddress}
                  </p>
                )}
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="px-6 pb-6">
            <p className="text-neutral-600 leading-relaxed">
              {message}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3 px-6 pb-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
            >
              {cancelButtonText}
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 rounded-lg bg-error-600 text-white font-medium hover:bg-error-700 transition-colors"
            >
              {confirmButtonText}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}