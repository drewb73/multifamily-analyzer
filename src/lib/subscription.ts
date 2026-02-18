// src/lib/subscription.ts
// Updated to support team member access

/**
 * Subscription Tier System
 * 
 * Tiers:
 * 1. FREE - Everything locked except contact/settings
 * 2. TRIAL - 72 hours, Analysis unlocked, Saved Analyses locked, PDF export locked
 * 3. PREMIUM - Everything unlocked including PDF export
 * 4. ENTERPRISE - Hidden placeholder for now
 * 5. TEAM MEMBER - Same access as Premium (through workspace owner)
 */

export type SubscriptionStatus = 'free' | 'trial' | 'premium' | 'enterprise';

export interface SubscriptionTierConfig {
  name: string;
  displayName: string;
  canAnalyze: boolean;
  canViewSavedAnalyses: boolean;
  canExportPDF: boolean;
  canAccessDealIQ: boolean;
  canStartTrial: boolean;
  showUpgradePrompt: boolean;
  maxAnalyses?: number; // undefined = unlimited
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionStatus, SubscriptionTierConfig> = {
  free: {
    name: 'free',
    displayName: 'Free',
    canAnalyze: false,
    canViewSavedAnalyses: false,
    canExportPDF: false,
    canAccessDealIQ: false,
    canStartTrial: true, // Can start trial if they haven't used it
    showUpgradePrompt: true,
    maxAnalyses: 0,
  },
  trial: {
    name: 'trial',
    displayName: '72-Hour Trial',
    canAnalyze: true,
    canViewSavedAnalyses: false,
    canExportPDF: false,
    canAccessDealIQ: false,
    canStartTrial: false,
    showUpgradePrompt: true,
    maxAnalyses: undefined, // Unlimited during trial
  },
  premium: {
    name: 'premium',
    displayName: 'Premium',
    canAnalyze: true,
    canViewSavedAnalyses: true,
    canExportPDF: true,
    canAccessDealIQ: true,
    canStartTrial: false,
    showUpgradePrompt: false,
    maxAnalyses: undefined, // Unlimited
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    canAnalyze: true,
    canViewSavedAnalyses: true,
    canExportPDF: true,
    canAccessDealIQ: true,
    canStartTrial: false,
    showUpgradePrompt: false,
    maxAnalyses: undefined, // Unlimited
  },
};

/**
 * Get tier configuration for a subscription status
 * Team members are treated as premium
 */
export function getTierConfig(
  status: SubscriptionStatus,
  isTeamMember: boolean = false
): SubscriptionTierConfig {
  // Team members get premium access regardless of their subscription status
  if (isTeamMember) {
    return SUBSCRIPTION_TIERS.premium;
  }
  return SUBSCRIPTION_TIERS[status] || SUBSCRIPTION_TIERS.free;
}

/**
 * Check if user can perform an action based on their subscription
 * Team members automatically get premium-level access
 */
export function canUserPerformAction(
  subscriptionStatus: SubscriptionStatus | null,
  action: 'analyze' | 'viewSavedAnalyses' | 'exportPDF' | 'accessDealIQ',
  isTeamMember: boolean = false
): boolean {
  if (!subscriptionStatus) return false;
  
  // Team members get premium access
  const tier = getTierConfig(subscriptionStatus, isTeamMember);
  
  switch (action) {
    case 'analyze':
      return tier.canAnalyze;
    case 'viewSavedAnalyses':
      return tier.canViewSavedAnalyses;
    case 'exportPDF':
      return tier.canExportPDF;
    case 'accessDealIQ':
      return tier.canAccessDealIQ;
    default:
      return false;
  }
}

/**
 * Check if user's trial has expired
 */
export function isTrialExpired(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return true;
  return new Date() > new Date(trialEndsAt);
}

/**
 * Calculate hours remaining in trial (for display)
 */
export function getTrialHoursRemaining(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  
  const now = new Date();
  const end = new Date(trialEndsAt);
  const hoursRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60)));
  
  return hoursRemaining;
}

/**
 * Get subscription badge info (for display)
 * Team members show as "Team Member" badge
 */
export function getSubscriptionBadge(
  status: SubscriptionStatus | null,
  isTeamMember: boolean = false
): {
  text: string;
  color: 'gray' | 'blue' | 'green' | 'purple';
} {
  // Team members get special badge
  if (isTeamMember) {
    return { text: 'Team Member', color: 'blue' };
  }

  if (!status) {
    return { text: 'Free', color: 'gray' };
  }

  const tier = getTierConfig(status);
  
  switch (status) {
    case 'trial':
      return { text: tier.displayName, color: 'blue' };
    case 'premium':
      return { text: tier.displayName, color: 'green' };
    case 'enterprise':
      return { text: tier.displayName, color: 'purple' };
    default:
      return { text: tier.displayName, color: 'gray' };
  }
}

/**
 * Get upgrade message based on subscription status
 */
export function getUpgradeMessage(
  status: SubscriptionStatus | null,
  hasUsedTrial: boolean = false,
  isTeamMember: boolean = false
): string {
  // Team members don't need to upgrade
  if (isTeamMember) {
    return '';
  }

  if (!status || status === 'free') {
    if (!hasUsedTrial) {
      return 'Start your 72-hour free trial or upgrade to Premium for unlimited access';
    }
    return 'Upgrade to Premium for unlimited access to all features';
  }
  
  if (status === 'trial') {
    return 'Upgrade to Premium to keep access after your trial ends';
  }
  
  return '';
}

/**
 * Get effective subscription status (handles trial expiration automatically)
 * This is what should be used for display and access control
 */
export function getEffectiveSubscriptionStatus(
  dbStatus: SubscriptionStatus,
  trialEndsAt: Date | null,
  hasUsedTrial: boolean = false
): SubscriptionStatus {
  // If trial status but trial has expired, return free
  if (dbStatus === 'trial' && isTrialExpired(trialEndsAt)) {
    return 'free';
  }
  
  return dbStatus;
}