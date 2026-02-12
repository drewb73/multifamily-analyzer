// File Location: src/lib/stripe-seats.ts
// Stripe helper functions for team workspace seat management

import Stripe from 'stripe';

// Initialize Stripe with your API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

// ============================================================================
// TYPES
// ============================================================================

export interface SeatPurchaseResult {
  success: boolean;
  subscriptionItemId?: string;
  error?: string;
}

export interface SeatInfo {
  purchased: number;
  used: number;
  available: number;
  monthlyCost: number;
  subscriptionItemId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SEAT_PRICE_ID = process.env.STRIPE_SEAT_PRICE_ID!;
const SEAT_PRICE = 9.99; // $9.99 per seat per month
const MAX_SEATS = 25; // Maximum seats allowed per workspace

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Purchase seats for a workspace owner
 * Creates a new subscription or adds a subscription item to existing subscription
 */
export async function purchaseSeats(
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  numberOfSeats: number
): Promise<SeatPurchaseResult> {
  try {
    // Validation
    if (numberOfSeats < 1 || numberOfSeats > MAX_SEATS) {
      return {
        success: false,
        error: `Number of seats must be between 1 and ${MAX_SEATS}`,
      };
    }

    // Get the existing subscription
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    // Check if they already have a seat subscription item
    const existingSeatItem = subscription.items.data.find(
      (item) => item.price.id === SEAT_PRICE_ID
    );

    if (existingSeatItem) {
      // They already have seats, use addSeats instead
      return {
        success: false,
        error: 'User already has seats. Use addSeats() to add more.',
      };
    }

    // Add the seat subscription item to their existing subscription
    const subscriptionItem = await stripe.subscriptionItems.create({
      subscription: stripeSubscriptionId,
      price: SEAT_PRICE_ID,
      quantity: numberOfSeats,
      proration_behavior: 'always_invoice', // Charge prorated amount immediately
    });

    return {
      success: true,
      subscriptionItemId: subscriptionItem.id,
    };
  } catch (error: any) {
    console.error('Error purchasing seats:', error);
    return {
      success: false,
      error: error.message || 'Failed to purchase seats',
    };
  }
}

/**
 * Add more seats to an existing seat subscription
 */
export async function addSeats(
  seatSubscriptionItemId: string,
  currentSeats: number,
  additionalSeats: number
): Promise<SeatPurchaseResult> {
  try {
    const newTotal = currentSeats + additionalSeats;

    // Validation
    if (newTotal > MAX_SEATS) {
      return {
        success: false,
        error: `Cannot exceed ${MAX_SEATS} total seats. You currently have ${currentSeats} seats.`,
      };
    }

    if (additionalSeats < 1) {
      return {
        success: false,
        error: 'Must add at least 1 seat',
      };
    }

    // Update the subscription item quantity
    await stripe.subscriptionItems.update(seatSubscriptionItemId, {
      quantity: newTotal,
      proration_behavior: 'always_invoice', // Charge prorated amount
    });

    return {
      success: true,
      subscriptionItemId: seatSubscriptionItemId,
    };
  } catch (error: any) {
    console.error('Error adding seats:', error);
    return {
      success: false,
      error: error.message || 'Failed to add seats',
    };
  }
}

/**
 * Remove unused seats
 * Can only remove seats that aren't currently used by team members
 */
export async function removeSeats(
  seatSubscriptionItemId: string,
  currentSeats: number,
  usedSeats: number,
  seatsToRemove: number
): Promise<SeatPurchaseResult> {
  try {
    const newTotal = currentSeats - seatsToRemove;

    // Validation
    if (seatsToRemove < 1) {
      return {
        success: false,
        error: 'Must remove at least 1 seat',
      };
    }

    if (newTotal < usedSeats) {
      return {
        success: false,
        error: `Cannot remove seats. You have ${usedSeats} team members using seats. Remove team members first.`,
      };
    }

    if (newTotal < 0) {
      return {
        success: false,
        error: 'Cannot remove more seats than you have',
      };
    }

    // Update the subscription item quantity
    await stripe.subscriptionItems.update(seatSubscriptionItemId, {
      quantity: newTotal,
      proration_behavior: 'always_invoice', // Refund prorated amount
    });

    return {
      success: true,
      subscriptionItemId: seatSubscriptionItemId,
    };
  } catch (error: any) {
    console.error('Error removing seats:', error);
    return {
      success: false,
      error: error.message || 'Failed to remove seats',
    };
  }
}

/**
 * Get current seat information for a user
 */
export async function getSeatInfo(
  purchasedSeats: number,
  usedSeats: number,
  seatSubscriptionItemId?: string
): Promise<SeatInfo> {
  const available = purchasedSeats - usedSeats;
  const monthlyCost = purchasedSeats * SEAT_PRICE;

  return {
    purchased: purchasedSeats,
    used: usedSeats,
    available: available,
    monthlyCost: monthlyCost,
    subscriptionItemId: seatSubscriptionItemId || undefined,
  };
}

/**
 * Calculate prorated cost for adding seats
 * We'll calculate this manually since we know the billing cycle
 */
export async function calculateProratedCost(
  additionalSeats: number
): Promise<{ proratedAmount: number; nextBillingAmount: number }> {
  try {
    // For simplicity, we'll assume a 30-day month
    // In production, you'd get this from the subscription
    const fullMonthCost = additionalSeats * SEAT_PRICE;
    
    // Return the full month cost for now
    // The actual proration happens automatically in Stripe
    return {
      proratedAmount: fullMonthCost, // Stripe will calculate actual proration
      nextBillingAmount: fullMonthCost,
    };
  } catch (error) {
    console.error('Error calculating prorated cost:', error);
    return {
      proratedAmount: 0,
      nextBillingAmount: 0,
    };
  }
}

/**
 * Check if user can purchase seats
 * Must have Premium subscription
 */
export async function canPurchaseSeats(
  subscriptionStatus: string,
  isAdmin: boolean
): Promise<{ canPurchase: boolean; reason?: string }> {
  // Admins can always purchase (for testing)
  if (isAdmin) {
    return { canPurchase: true };
  }

  // Must have premium subscription
  if (subscriptionStatus !== 'premium') {
    return {
      canPurchase: false,
      reason: 'Must have Premium subscription to purchase seats',
    };
  }

  return { canPurchase: true };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get seat price constant
 */
export function getSeatPrice(): number {
  return SEAT_PRICE;
}

/**
 * Get max seats constant
 */
export function getMaxSeats(): number {
  return MAX_SEATS;
}

/**
 * Calculate monthly cost for seats
 */
export function calculateMonthlyCost(numberOfSeats: number): number {
  return numberOfSeats * SEAT_PRICE;
}

/**
 * Validate seat quantity
 */
export function isValidSeatQuantity(quantity: number): {
  valid: boolean;
  error?: string;
} {
  if (quantity < 1) {
    return { valid: false, error: 'Must have at least 1 seat' };
  }

  if (quantity > MAX_SEATS) {
    return { valid: false, error: `Cannot exceed ${MAX_SEATS} seats` };
  }

  return { valid: true };
}