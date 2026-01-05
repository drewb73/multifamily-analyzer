// FILE 8 of 8: REPLACE ENTIRE FILE
// Location: src/components/dashboard/LockedFeatureWrapper.tsx
// Action: REPLACE YOUR ENTIRE LockedFeatureWrapper.tsx WITH THIS

'use client'

import { Lock } from 'lucide-react'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import Link from 'next/link'

interface LockedFeatureWrapperProps {
  canStartTrial: boolean
}

export function LockedFeatureWrapper({ canStartTrial }: LockedFeatureWrapperProps) {
  const { settings } = useSystemSettings()
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <Lock className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
      
      <h2 className="text-2xl font-bold text-neutral-900 mb-2">
        This Feature is Locked
      </h2>
      
      <p className="text-neutral-600 mb-6">
        {canStartTrial
          ? "Start your FREE 72-hour trial to unlock unlimited property analysis with no credit card required!"
          : "Upgrade to Premium to unlock unlimited property analysis and advanced features."}
      </p>
      
      {/* Check if Stripe is enabled */}
      {settings?.stripeEnabled ? (
        <>
          {canStartTrial ? (
            <Link 
              href="/dashboard/start-trial"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Start Free Trial
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Upgrade to Premium
            </Link>
          )}
        </>
      ) : (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-neutral-600">
            Upgrades are temporarily unavailable. Please check back later.
          </p>
        </div>
      )}
    </div>
  )
}