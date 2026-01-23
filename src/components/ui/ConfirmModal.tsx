// FILE LOCATION: /src/components/ui/ConfirmModal.tsx
// PURPOSE: Reusable confirmation modal for delete/replace actions
'use client'

import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info' | 'success'
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      iconBg: 'bg-error-100',
      iconColor: 'text-error-600',
      icon: AlertTriangle,
      buttonBg: 'bg-error-600 hover:bg-error-700',
      buttonText: 'text-white'
    },
    warning: {
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-600',
      icon: AlertTriangle,
      buttonBg: 'bg-warning-600 hover:bg-warning-700',
      buttonText: 'text-white'
    },
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: Info,
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
      buttonText: 'text-white'
    },
    success: {
      iconBg: 'bg-success-100',
      iconColor: 'text-success-600',
      icon: CheckCircle,
      buttonBg: 'bg-success-600 hover:bg-success-700',
      buttonText: 'text-white'
    }
  }

  const styles = variantStyles[variant]
  const Icon = styles.icon

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className={`w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-6 h-6 ${styles.iconColor}`} />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-neutral-900 mb-2 text-center">
          {title}
        </h2>

        {/* Message */}
        <p className="text-neutral-600 mb-6 text-center leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg text-neutral-700 font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles.buttonBg} ${styles.buttonText}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}