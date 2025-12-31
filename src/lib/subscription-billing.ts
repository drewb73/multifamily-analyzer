// src/lib/subscription-billing.ts

/**
 * Subscription Billing Period Logic
 * 
 * This handles the "paid for the month" logic where users keep
 * premium access until the end of their billing period even after cancellation.
 */

export interface BillingPeriod {
  start: Date
  end: Date
  daysRemaining: number
  isActive: boolean
  isCancelled: boolean
}

/**
 * Calculate if user has active premium access based on billing period
 * 
 * @param subscriptionStatus - Current status from database
 * @param subscriptionEndsAt - End of billing period from database
 * @returns Whether user should have premium access
 * 
 * Examples:
 * - User subscribed Dec 1, cancelled Dec 3, today is Dec 15
 *   → subscriptionEndsAt is Jan 1
 *   → isPremiumActive() returns TRUE (still has access)
 * 
 * - User subscribed Dec 1, cancelled Dec 3, today is Jan 5
 *   → subscriptionEndsAt is Jan 1
 *   → isPremiumActive() returns FALSE (billing period ended)
 */
export function isPremiumActive(
  subscriptionStatus: string,
  subscriptionEndsAt: Date | null
): boolean {
  // If status is not premium, no access
  if (subscriptionStatus !== 'premium') {
    return false
  }

  // If no end date set, assume active (shouldn't happen in production)
  if (!subscriptionEndsAt) {
    return true
  }

  // Check if we're still within the billing period
  const now = new Date()
  return now < subscriptionEndsAt
}

/**
 * Get billing period information for a user
 * 
 * @param subscriptionStatus - Current status from database
 * @param subscriptionEndsAt - End of billing period from database
 * @param createdAt - When subscription was created (fallback)
 * @returns Billing period details
 */
export function getBillingPeriod(
  subscriptionStatus: string,
  subscriptionEndsAt: Date | null,
  createdAt?: Date
): BillingPeriod | null {
  if (subscriptionStatus !== 'premium') {
    return null
  }

  if (!subscriptionEndsAt) {
    return null
  }

  const now = new Date()
  const end = new Date(subscriptionEndsAt)
  
  // Calculate start date (30 days before end)
  const start = new Date(end)
  start.setDate(start.getDate() - 30)

  // Calculate days remaining
  const diffMs = end.getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

  // Check if period is still active
  const isActive = now < end

  // In production with Stripe, we would check subscription.cancel_at_period_end
  // For now, assume cancelled if end date is set but status is premium
  const isCancelled = false // TODO: Add cancellation flag to schema

  return {
    start,
    end,
    daysRemaining,
    isActive,
    isCancelled
  }
}

/**
 * Calculate next billing date (30 days from now)
 * 
 * @returns Date 30 days in the future
 */
export function calculateNextBillingDate(): Date {
  const nextBilling = new Date()
  nextBilling.setDate(nextBilling.getDate() + 30)
  return nextBilling
}

/**
 * Format billing period for display
 * 
 * @param billingPeriod - Billing period object
 * @returns Human-readable string
 * 
 * Examples:
 * - "Premium until Jan 1, 2025 (15 days remaining)"
 * - "Premium until Dec 31, 2024 (expired)"
 */
export function formatBillingPeriod(billingPeriod: BillingPeriod | null): string {
  if (!billingPeriod) {
    return 'No active billing period'
  }

  const { end, daysRemaining, isActive } = billingPeriod
  const dateStr = end.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })

  if (!isActive) {
    return `Premium expired on ${dateStr}`
  }

  if (daysRemaining === 0) {
    return `Premium expires today`
  }

  if (daysRemaining === 1) {
    return `Premium until ${dateStr} (1 day remaining)`
  }

  return `Premium until ${dateStr} (${daysRemaining} days remaining)`
}

/**
 * Check if subscription should be auto-renewed
 * In production, this would check Stripe's cancel_at_period_end flag
 * 
 * @param user - User object from database
 * @returns Whether subscription will auto-renew
 */
export function willAutoRenew(user: {
  subscriptionStatus: string
  subscriptionEndsAt: Date | null
  stripeSubscriptionId?: string | null
}): boolean {
  if (user.subscriptionStatus !== 'premium') {
    return false
  }

  // In production with Stripe:
  // const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
  // return !subscription.cancel_at_period_end

  // For now, assume will renew if has end date
  return !!user.subscriptionEndsAt
}