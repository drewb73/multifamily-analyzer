// src/components/dashboard/LockedFeatureWrapper.tsx
'use client'

import { LockedFeature } from './LockedFeature'

interface LockedFeatureWrapperProps {
  canStartTrial: boolean
}

export function LockedFeatureWrapper({ canStartTrial }: LockedFeatureWrapperProps) {
  return (
    <LockedFeature
      title="Property Analysis Locked"
      description={
        canStartTrial
          ? "Start your FREE 72-hour trial to unlock unlimited property analysis with no credit card required!"
          : "Upgrade to Premium to unlock unlimited property analysis and advanced features."
      }
      canStartTrial={canStartTrial}
      onStartTrial={() => {
        window.location.href = '/dashboard/start-trial';
      }}
      onUpgrade={() => {
        window.location.href = '/pricing';
      }}
    />
  )
}