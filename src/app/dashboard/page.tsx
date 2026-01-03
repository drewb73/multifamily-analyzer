// src/app/dashboard/page.tsx
import { PropertyAnalysisForm } from '@/components/analysis/PropertyAnalysisForm';
import { LockedFeatureWrapper } from '@/components/dashboard/LockedFeatureWrapper';
import { MaintenanceLock } from '@/components/dashboard/MaintenanceLock';
import { getCurrentDbUser } from '@/lib/auth';
import { getEffectiveSubscriptionStatus, canUserPerformAction } from '@/lib/subscription';
import { getSystemSettings } from '@/lib/settings';
import { redirect } from 'next/navigation';

interface DashboardPageProps {
  searchParams: Promise<{ analysisId?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Fetch current user's subscription status from database
  const dbUser = await getCurrentDbUser();
  
  if (!dbUser) {
    redirect('/sign-in');
  }

  // Check system settings
  const systemSettings = await getSystemSettings();

  // If analysis is disabled, show maintenance lock
  if (!systemSettings.analysisEnabled) {
    return <MaintenanceLock feature="Property Analysis" />
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

  // Get analysisId from query params if present (await for Next.js 15)
  const params = await searchParams;
  const analysisId = params.analysisId;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900">
          {analysisId ? 'View Analysis' : 'Analyze Property'}
        </h1>
        <p className="text-lg text-neutral-600 mt-2">
          {analysisId 
            ? 'View your saved analysis details'
            : 'Enter property details to calculate key investment metrics'
          }
        </p>
      </div>
      
      {canAnalyze ? (
        // User can analyze - show the form with analysisId if present
        <PropertyAnalysisForm 
          draftId={analysisId} 
          userSubscriptionStatus={effectiveStatus} 
        />
      ) : (
        // User cannot analyze - show locked feature
        <LockedFeatureWrapper canStartTrial={canStartTrial} />
      )}
    </div>
  );
}