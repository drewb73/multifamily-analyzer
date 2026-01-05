// FILE 1 of 9: Stripe Maintenance Component
// Location: src/components/StripeMaintenancePage.tsx
// CREATE NEW FILE

'use client'

import { CreditCard, ArrowLeft, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface StripeMaintenancePageProps {
  message?: string
  showBackButton?: boolean
}

export function StripeMaintenancePage({ 
  message, 
  showBackButton = true 
}: StripeMaintenancePageProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-12 text-center">
          {/* Icon */}
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CreditCard className="w-12 h-12 text-primary-600" />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            Payment System Temporarily Unavailable
          </h1>

          {/* Message */}
          <p className="text-lg text-neutral-600 mb-8">
            {message || "We're currently performing maintenance on our payment system. You can still use all other features of the platform."}
          </p>

          {/* Info Box */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-primary-900 mb-2">
              What You Can Do
            </h2>
            <ul className="text-sm text-primary-800 space-y-2 text-left max-w-md mx-auto">
              <li>✓ Continue using all free features</li>
              <li>✓ Access your saved analyses</li>
              <li>✓ Create new property analyses</li>
              <li>✓ View and manage your account</li>
            </ul>
          </div>

          {/* Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Existing subscriptions remain active during this time. 
              Your premium access is not affected.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showBackButton && (
              <button
                onClick={() => router.back()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            )}
            
            <a
              href="mailto:numexre.spt@gmail.com"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-neutral-500">
          We apologize for any inconvenience and appreciate your patience.
        </div>
      </div>
    </div>
  )
}