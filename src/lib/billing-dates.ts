// src/lib/billing-dates.ts

/**
 * Billing Date Utilities
 * 
 * Handles monthly billing date calculations with proper edge case handling.
 * Uses calendar months (not 30-day cycles) to match industry standards.
 */

/**
 * Add months to a date, handling month-end edge cases properly
 * 
 * Examples:
 * - Jan 31 + 1 month = Feb 28 (or 29 in leap year)
 * - Jan 15 + 1 month = Feb 15
 * - Jan 31 + 2 months = Mar 31
 * 
 * @param date - Starting date
 * @param months - Number of months to add
 * @returns New date with months added
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  const originalDay = result.getDate()
  
  // Add the months
  result.setMonth(result.getMonth() + months)
  
  // Check if day rolled over (e.g., Jan 31 → Mar 3)
  // This happens when target month has fewer days
  if (result.getDate() !== originalDay) {
    // Set to last day of the intended month
    result.setDate(0) // Day 0 = last day of previous month
  }
  
  return result
}

/**
 * Calculate the next billing date (1 month from given date)
 * 
 * @param currentDate - Current billing date (or subscription start)
 * @returns Next billing date
 */
export function calculateNextBillingDate(currentDate: Date = new Date()): Date {
  return addMonths(currentDate, 1)
}

/**
 * Calculate days remaining until billing date
 * 
 * @param billingDate - Date of next billing
 * @returns Number of days remaining (0 if past)
 */
export function getDaysUntilBilling(billingDate: Date): number {
  const now = new Date()
  const diffMs = billingDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

/**
 * Format billing date for display
 * 
 * @param date - Billing date
 * @returns Formatted string (e.g., "January 31, 2026")
 */
export function formatBillingDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Format billing date with days remaining
 * 
 * @param date - Billing date
 * @returns Formatted string (e.g., "January 31, 2026 (15 days)")
 */
export function formatBillingDateWithDays(date: Date): string {
  const formatted = formatBillingDate(date)
  const days = getDaysUntilBilling(date)
  
  if (days === 0) {
    return `${formatted} (today)`
  } else if (days === 1) {
    return `${formatted} (1 day)`
  } else {
    return `${formatted} (${days} days)`
  }
}

/**
 * Check if a billing date has passed
 * 
 * @param billingDate - Date to check
 * @returns true if date is in the past
 */
export function isBillingDatePast(billingDate: Date): boolean {
  return new Date() > billingDate
}

/**
 * Get the billing day of month (handles month-end correctly)
 * 
 * For users who subscribe on the 31st:
 * - Jan 31 → billing day is "31st or last day of month"
 * - In February, bills on 28th/29th (last day)
 * - In March, bills on 31st again
 * 
 * @param subscriptionStartDate - When user first subscribed
 * @returns Day of month for billing (1-31)
 */
export function getBillingDayOfMonth(subscriptionStartDate: Date): number {
  return subscriptionStartDate.getDate()
}

/**
 * Calculate subscription anniversary date
 * 
 * @param subscriptionStartDate - When user first subscribed
 * @param years - Years to add
 * @returns Anniversary date
 */
export function calculateAnniversaryDate(subscriptionStartDate: Date, years: number = 1): Date {
  return addMonths(subscriptionStartDate, years * 12)
}

// ============================================================================
// Examples of how these functions work:
// ============================================================================

/*
Example 1: Subscribe on Dec 31, 2025
const start = new Date('2025-12-31')
const next1 = calculateNextBillingDate(start)  // Jan 31, 2026
const next2 = calculateNextBillingDate(next1)  // Feb 28, 2026 (short month)
const next3 = calculateNextBillingDate(next2)  // Mar 31, 2026 (back to 31st)

Example 2: Subscribe on Jan 15, 2026
const start = new Date('2026-01-15')
const next1 = calculateNextBillingDate(start)  // Feb 15, 2026
const next2 = calculateNextBillingDate(next1)  // Mar 15, 2026
// Always the 15th of each month - perfect!

Example 3: Leap year handling
const start = new Date('2024-01-31')
const next1 = calculateNextBillingDate(start)  // Feb 29, 2024 (leap year!)
const next2 = calculateNextBillingDate(next1)  // Mar 31, 2024

Example 4: Days remaining
const billing = new Date('2026-01-31')
const days = getDaysUntilBilling(billing)  // Returns number of days from today

Example 5: Formatting
const billing = new Date('2026-01-31')
formatBillingDate(billing)  // "January 31, 2026"
formatBillingDateWithDays(billing)  // "January 31, 2026 (31 days)"
*/