// src/app/dashboard/page.tsx
import { PropertyAnalysisForm } from '@/components/analysis/PropertyAnalysisForm';
import { LockedFeatureWrapper } from '@/components/dashboard/LockedFeatureWrapper';
import { getCurrentDbUser } from '@/lib/auth';
import { getEffectiveSubscriptionStatus, canUserPerformAction } from '@/lib/subscription';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
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

  // Check if user can analyze properties
  const canAnalyze = canUserPerformAction(effectiveStatus, 'analyze');
  const canStartTrial = effectiveStatus === 'free' && !dbUser.hasUsedTrial;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900">
          Analyze Property
        </h1>
        <p className="text-lg text-neutral-600 mt-2">
          Enter property details to calculate key investment metrics
        </p>
      </div>
      
      {canAnalyze ? (
        // User can analyze - show the form
        <PropertyAnalysisForm userSubscriptionStatus={effectiveStatus} />
      ) : (
        // User cannot analyze - show locked feature
        <LockedFeatureWrapper canStartTrial={canStartTrial} />
      )}
    </div>
  );
}