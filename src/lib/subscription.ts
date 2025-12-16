// src/lib/subscription.ts

/**
 * Subscription Tier System
 * 
 * Tiers:
 * 1. FREE - Everything locked except contact/settings
 * 2. TRIAL - 72 hours, Analysis unlocked, Saved Analyses locked, PDF export locked
 * 3. PREMIUM - Everything unlocked including PDF export
 * 4. ENTERPRISE - Hidden placeholder for now
 */

export type SubscriptionStatus = 'free' | 'trial' | 'premium' | 'enterprise';

export interface SubscriptionTierConfig {
  name: string;
  displayName: string;
  canAnalyze: boolean;
  canViewSavedAnalyses: boolean;
  canExportPDF: boolean;
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
    canStartTrial: false,
    showUpgradePrompt: false,
    maxAnalyses: undefined, // Unlimited
  },
};

/**
 * Get tier configuration for a subscription status
 */
export function getTierConfig(status: SubscriptionStatus): SubscriptionTierConfig {
  return SUBSCRIPTION_TIERS[status] || SUBSCRIPTION_TIERS.free;
}

/**
 * Check if user can perform an action based on their subscription
 */
export function canUserPerformAction(
  subscriptionStatus: SubscriptionStatus | null,
  action: 'analyze' | 'viewSavedAnalyses' | 'exportPDF'
): boolean {
  if (!subscriptionStatus) return false;
  
  const tier = getTierConfig(subscriptionStatus);
  
  switch (action) {
    case 'analyze':
      return tier.canAnalyze;
    case 'viewSavedAnalyses':
      return tier.canViewSavedAnalyses;
    case 'exportPDF':
      return tier.canExportPDF;
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
 * Get trial time remaining in hours
 */
export function getTrialHoursRemaining(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  
  const now = new Date();
  const end = new Date(trialEndsAt);
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) return 0;
  
  return Math.ceil(diff / (1000 * 60 * 60)); // Convert to hours
}

/**
 * Get display badge for subscription status
 */
export function getSubscriptionBadge(status: SubscriptionStatus | null): {
  text: string;
  color: string;
} {
  if (!status) {
    return { text: 'Free', color: 'bg-neutral-100 text-neutral-700' };
  }
  
  const tier = getTierConfig(status);
  
  switch (status) {
    case 'trial':
      return { text: tier.displayName, color: 'bg-warning-100 text-warning-700' };
    case 'premium':
      return { text: tier.displayName, color: 'bg-success-100 text-success-700' };
    case 'enterprise':
      return { text: tier.displayName, color: 'bg-primary-100 text-primary-700' };
    default:
      return { text: tier.displayName, color: 'bg-neutral-100 text-neutral-700' };
  }
}

/**
 * Get upgrade message based on current status and action
 */
export function getUpgradeMessage(
  subscriptionStatus: SubscriptionStatus | null,
  hasUsedTrial: boolean,
  action: 'analyze' | 'viewSavedAnalyses' | 'exportPDF'
): string {
  const tier = subscriptionStatus ? getTierConfig(subscriptionStatus) : null;
  
  // Free tier messages
  if (subscriptionStatus === 'free') {
    if (action === 'analyze') {
      if (!hasUsedTrial) {
        return '🚀 Start your FREE 72-hour trial to unlock property analysis!\n\nClick "Start Free Trial" in the top right corner.';
      } else {
        return '⭐ Upgrade to Premium to analyze properties!\n\nClick "Upgrade Account" in the top right corner.';
      }
    }
  }
  
  // Trial tier messages
  if (subscriptionStatus === 'trial') {
    if (action === 'viewSavedAnalyses') {
      return '⭐ Upgrade to Premium to save and view your analyses!\n\nYour trial allows you to create analyses, but saving requires Premium.';
    }
    if (action === 'exportPDF') {
      return '⭐ Upgrade to Premium to export your analyses to PDF!\n\nClick "Upgrade Account" in the top right corner.';
    }
  }
  
  // Default message
  return '⭐ Upgrade to Premium to access this feature!\n\nClick "Upgrade Account" in the top right corner.';
}

/**
 * Determine effective subscription status
 * Handles trial expiration logic
 */
export function getEffectiveSubscriptionStatus(
  subscriptionStatus: SubscriptionStatus | null,
  trialEndsAt: Date | null,
  hasUsedTrial: boolean
): SubscriptionStatus {
  // Premium/Enterprise always stay premium/enterprise
  if (subscriptionStatus === 'premium' || subscriptionStatus === 'enterprise') {
    return subscriptionStatus;
  }
  
  // If trial status but trial expired, convert to free
  if (subscriptionStatus === 'trial' && isTrialExpired(trialEndsAt)) {
    return 'free';
  }
  
  // If trial and not expired, stay trial
  if (subscriptionStatus === 'trial') {
    return 'trial';
  }
  
  // Everything else is free
  return 'free';
}