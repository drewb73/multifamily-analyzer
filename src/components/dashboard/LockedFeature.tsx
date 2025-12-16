// src/components/dashboard/LockedFeature.tsx
'use client'

import { Card } from '@/components'
import { Lock, Zap } from 'lucide-react'

interface LockedFeatureProps {
  title: string
  description: string
  canStartTrial: boolean
  onStartTrial?: () => void
  onUpgrade?: () => void
}

export function LockedFeature({
  title,
  description,
  canStartTrial,
  onStartTrial,
  onUpgrade,
}: LockedFeatureProps) {
  return (
    <Card className="p-8 text-center">
      <div className="max-w-md mx-auto">
        {/* Lock Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
          <Lock className="w-8 h-8 text-neutral-400" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
          {title}
        </h2>

        {/* Description */}
        <p className="text-neutral-600 mb-6">
          {description}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {canStartTrial && onStartTrial && (
            <button
              onClick={onStartTrial}
              className="btn-primary px-6 py-3 text-base font-semibold flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Start Free 72-Hour Trial
            </button>
          )}
          
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className={`px-6 py-3 text-base font-semibold rounded-lg transition-colors ${
                canStartTrial
                  ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  : 'btn-primary flex items-center justify-center gap-2'
              }`}
            >
              ⭐ Upgrade to Premium
            </button>
          )}
        </div>

        {/* Features List */}
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">
            {canStartTrial ? 'Trial includes:' : 'Premium includes:'}
          </h3>
          <ul className="text-sm text-neutral-600 space-y-2">
            {canStartTrial ? (
              <>
                <li>✓ Unlimited property analyses</li>
                <li>✓ Full access for 72 hours</li>
                <li>✓ No credit card required</li>
              </>
            ) : (
              <>
                <li>✓ Unlimited property analyses</li>
                <li>✓ Save and view all analyses</li>
                <li>✓ Export to PDF</li>
                <li>✓ Priority support</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </Card>
  )
}