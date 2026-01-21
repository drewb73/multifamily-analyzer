// src/app/dashboard/page.tsx
import { PropertyAnalysisForm } from '@/components/analysis/PropertyAnalysisForm';
import { LockedFeatureWrapper } from '@/components/dashboard/LockedFeatureWrapper';
import { MaintenanceLock } from '@/components/dashboard/MaintenanceLock';
import { getCurrentDbUser } from '@/lib/auth';
import { getEffectiveSubscriptionStatus, canUserPerformAction } from '@/lib/subscription';
import { getSystemSettings } from '@/lib/settings';
import { redirect } from 'next/navigation';
import { DashboardBanner } from '@/components/DashboardBanner';
import { prisma } from '@/lib/prisma';


interface DashboardPageProps {
  searchParams: Promise<{ 
    analysisId?: string
    fromDeal?: string  // ✅ NEW: For creating analysis from deal
  }>
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

  // Get params (await for Next.js 15)
  const params = await searchParams;
  const analysisId = params.analysisId;
  const fromDeal = params.fromDeal;  // ✅ NEW
  
  // ✅ NEW: Fetch deal data if fromDeal is present
  let dealData = null;
  if (fromDeal) {
    try {
      const deal = await prisma.deal.findUnique({
        where: { 
          id: fromDeal,
          userId: dbUser.id 
        }
      });
      
      if (deal) {
        dealData = {
          dealId: deal.id,
          address: deal.address,
          city: deal.city,
          state: deal.state,
          zipCode: deal.zipCode,
          purchasePrice: deal.price,
          downPayment: deal.downPayment,
          loanTerm: deal.loanTerm,
          loanRate: deal.loanRate,
          propertySize: deal.squareFeet,
          totalUnits: deal.units,
          isCashPurchase: deal.financingType === 'cash'
        };
        
        console.log('📊 Pre-populating analysis from deal:', deal.dealId);
      }
    } catch (error) {
      console.error('Error fetching deal:', error);
    }
  }

  return (
    <div>
      <DashboardBanner />
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900">
          {analysisId ? 'View Analysis' : fromDeal ? 'Create Analysis for Deal' : 'Analyze Property'}
        </h1>
        <p className="text-lg text-neutral-600 mt-2">
          {analysisId 
            ? 'View your saved analysis details'
            : fromDeal
            ? 'Complete the analysis to see financial metrics for this deal'
            : 'Enter property details to calculate key investment metrics'
          }
        </p>
      </div>
      
      {canAnalyze ? (
        // User can analyze - show the form with analysisId or dealData if present
        <PropertyAnalysisForm 
          draftId={analysisId} 
          userSubscriptionStatus={effectiveStatus}
          initialDealData={dealData}  // ✅ NEW: Pass deal data for pre-population
        />
      ) : (
        // User cannot analyze - show locked feature
        <LockedFeatureWrapper canStartTrial={canStartTrial} />
      )}
    </div>
  );
}