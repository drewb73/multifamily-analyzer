// src/components/analysis/ValidationError.tsx
'use client'

import { AlertTriangle, X } from 'lucide-react'

interface ValidationErrorProps {
  errors: string[]
  onClose: () => void
}

export function ValidationError({ errors, onClose }: ValidationErrorProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Warning Icon */}
        <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-warning-600" />
        </div>
        
        <h2 className="text-xl font-bold text-neutral-900 mb-2 text-center">
          Please Complete Required Fields
        </h2>
        
        <p className="text-neutral-600 mb-4 text-center text-sm">
          Please fix the following errors before continuing:
        </p>
        
        {/* Error List */}
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-6">
          <ul className="space-y-2">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-warning-900">
                <span className="text-warning-600 flex-shrink-0 mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <button
          onClick={onClose}
          className="btn-primary w-full"
        >
          Got it
        </button>
      </div>
    </div>
  )
}