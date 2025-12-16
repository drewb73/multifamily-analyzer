// src/app/dashboard/saved/page.tsx
import { SavedAnalysesClient } from '@/components/dashboard/SavedAnalysesClient';
import { LockedFeatureWrapper } from '@/components/dashboard/LockedFeatureWrapper';
import { getCurrentDbUser } from '@/lib/auth';
import { getEffectiveSubscriptionStatus, canUserPerformAction } from '@/lib/subscription';
import { redirect } from 'next/navigation';
import { Lock } from 'lucide-react';

export default async function SavedAnalysesPage() {
  // Fetch current user's subscription status from database
  const dbUser = await getCurrentDbUser();
  
  if (!dbUser) {
    redirect('/sign-in');
  }

  // Get effective subscription status (handles trial expiration)
  const effectiveStatus = getEffectiveSubscriptionStatus(
    dbUser.subscriptionStatus as any,
    dbUser.trialEndsAt,
    dbUser.hasUsedTrial
  );

  // Check if user can view saved analyses
  const canViewSavedAnalyses = canUserPerformAction(effectiveStatus, 'viewSavedAnalyses');
  const canStartTrial = effectiveStatus === 'free' && !dbUser.hasUsedTrial;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Saved Analyses
          </h1>
          {!canViewSavedAnalyses && (
            <Lock className="h-6 w-6 text-warning-500" />
          )}
        </div>
        <p className="text-lg text-neutral-600 mt-2">
          {canViewSavedAnalyses 
            ? 'Access your saved property analyses'
            : 'Save and access your property analyses (Premium Feature)'
          }
        </p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {canViewSavedAnalyses ? (
          // Premium user - show saved analyses with subscription status
          <SavedAnalysesClient userSubscriptionStatus={effectiveStatus} />
        ) : (
          // Non-premium user - show locked feature
          <LockedFeatureWrapper canStartTrial={canStartTrial} />
        )}
      </div>
    </div>
  );
}