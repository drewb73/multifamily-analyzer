// FILE LOCATION: /src/components/ui/SuccessToast.tsx
// PURPOSE: Reusable success toast notification
'use client'

import { useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'

interface SuccessToastProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message?: string
  duration?: number // Auto-close after X milliseconds
}

export function SuccessToast({
  isOpen,
  onClose,
  title,
  message,
  duration = 4000
}: SuccessToastProps) {
  useEffect(() => {
    if (isOpen && duration) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed top-4 right-4 z-[70] animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="bg-white rounded-lg shadow-2xl border border-success-200 p-4 max-w-md min-w-[320px]">
        <div className="flex items-start gap-3">
          {/* Success Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">
              {title}
            </h3>
            {message && (
              <p className="text-sm text-neutral-600 leading-relaxed">
                {message}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        {duration && (
          <div className="mt-3 h-1 bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-success-500 rounded-full transition-all"
              style={{
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}