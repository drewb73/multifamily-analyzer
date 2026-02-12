// File Location: src/lib/stripe-seats.ts
// Stripe helper functions for seat management with admin bypass

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as any,
});

// Constants
export const SEAT_PRICE = 9.99;
export const MAX_SEATS = 25;

// Get seat price ID from environment
function getSeatPriceId(): string {
  const priceId = process.env.STRIPE_SEAT_PRICE_ID;
  if (!priceId) {
    throw new Error('STRIPE_SEAT_PRICE_ID not configured');
  }
  return priceId;
}

// Check if user has valid Premium subscription (Stripe or manual)
export async function canPurchaseSeats(
  subscriptionStatus: string,
  isAdmin: boolean
): Promise<{ allowed: boolean; reason?: string }> {
  // Admins can always purchase seats
  if (isAdmin) {
    return { allowed: true };
  }

  // Must have Premium subscription (Stripe or manual grant)
  if (subscriptionStatus !== 'premium') {
    return {
      allowed: false,
      reason: 'Premium subscription required to purchase seats',
    };
  }

  return { allowed: true };
}

// Purchase seats for the first time
export async function purchaseSeats(
  userId: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null,
  quantity: number,
  isAdmin: boolean
): Promise<{
  success: boolean;
  subscriptionItemId?: string;
  error?: string;
}> {
  try {
    // Validate quantity
    if (!isValidSeatQuantity(quantity)) {
      return {
        success: false,
        error: `Invalid quantity. Must be between 1 and ${MAX_SEATS}`,
      };
    }

    // ADMIN BYPASS: Admins don't need Stripe
    if (isAdmin) {
      console.log(`🔑 Admin ${userId} purchasing ${quantity} seats (Stripe bypassed)`);
      return {
        success: true,
        subscriptionItemId: 'admin-bypass', // Special value for admins
      };
    }

    // Regular users must have Stripe customer and subscription
    if (!stripeCustomerId || !stripeSubscriptionId) {
      return {
        success: false,
        error: 'Stripe customer or subscription not found. Please ensure you have an active Premium subscription.',
      };
    }

    // Get the subscription
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    if (!subscription) {
      return {
        success: false,
        error: 'Subscription not found in Stripe',
      };
    }

    // Add seat subscription item
    const subscriptionItem = await stripe.subscriptionItems.create({
      subscription: stripeSubscriptionId,
      price: getSeatPriceId(),
      quantity: quantity,
    });

    console.log(`✅ User ${userId} purchased ${quantity} seats via Stripe`);

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

// Add more seats to existing subscription
export async function addSeats(
  userId: string,
  seatSubscriptionItemId: string,
  currentQuantity: number,
  additionalSeats: number,
  isAdmin: boolean
): Promise<{
  success: boolean;
  newQuantity?: number;
  error?: string;
}> {
  try {
    const newQuantity = currentQuantity + additionalSeats;

    // Validate new quantity
    if (!isValidSeatQuantity(newQuantity)) {
      return {
        success: false,
        error: `Total seats would exceed maximum of ${MAX_SEATS}`,
      };
    }

    // ADMIN BYPASS: Admins don't need Stripe
    if (isAdmin) {
      console.log(`🔑 Admin ${userId} adding ${additionalSeats} seats (Stripe bypassed)`);
      return {
        success: true,
        newQuantity,
      };
    }

    // Regular users need valid subscription item
    if (!seatSubscriptionItemId || seatSubscriptionItemId === 'admin-bypass') {
      return {
        success: false,
        error: 'No seat subscription found. Please purchase seats first.',
      };
    }

    // Update subscription item quantity
    await stripe.subscriptionItems.update(seatSubscriptionItemId, {
      quantity: newQuantity,
      proration_behavior: 'create_prorations', // Prorate the cost
    });

    console.log(`✅ User ${userId} added ${additionalSeats} seats (new total: ${newQuantity})`);

    return {
      success: true,
      newQuantity,
    };
  } catch (error: any) {
    console.error('Error adding seats:', error);
    return {
      success: false,
      error: error.message || 'Failed to add seats',
    };
  }
}

// Remove unused seats
export async function removeSeats(
  userId: string,
  seatSubscriptionItemId: string,
  currentQuantity: number,
  seatsToRemove: number,
  usedSeats: number,
  isAdmin: boolean
): Promise<{
  success: boolean;
  newQuantity?: number;
  error?: string;
}> {
  try {
    const newQuantity = currentQuantity - seatsToRemove;

    // Validate we're not removing more than we have
    if (seatsToRemove > currentQuantity) {
      return {
        success: false,
        error: 'Cannot remove more seats than you have',
      };
    }

    // Validate we're not removing seats that are in use
    if (newQuantity < usedSeats) {
      return {
        success: false,
        error: `Cannot remove seats that are in use. ${usedSeats} seats are currently being used by team members.`,
      };
    }

    // Must keep at least 0 seats
    if (newQuantity < 0) {
      return {
        success: false,
        error: 'Invalid quantity',
      };
    }

    // ADMIN BYPASS: Admins don't need Stripe
    if (isAdmin) {
      console.log(`🔑 Admin ${userId} removing ${seatsToRemove} seats (Stripe bypassed)`);
      return {
        success: true,
        newQuantity,
      };
    }

    // Regular users need valid subscription item
    if (!seatSubscriptionItemId || seatSubscriptionItemId === 'admin-bypass') {
      return {
        success: false,
        error: 'No seat subscription found',
      };
    }

    // If removing all seats, delete the subscription item
    if (newQuantity === 0) {
      await stripe.subscriptionItems.del(seatSubscriptionItemId, {
        proration_behavior: 'create_prorations',
      });
      console.log(`✅ User ${userId} removed all seats (subscription item deleted)`);
    } else {
      // Update subscription item quantity
      await stripe.subscriptionItems.update(seatSubscriptionItemId, {
        quantity: newQuantity,
        proration_behavior: 'create_prorations', // Credit the account
      });
      console.log(`✅ User ${userId} removed ${seatsToRemove} seats (new total: ${newQuantity})`);
    }

    return {
      success: true,
      newQuantity,
    };
  } catch (error: any) {
    console.error('Error removing seats:', error);
    return {
      success: false,
      error: error.message || 'Failed to remove seats',
    };
  }
}

// Get seat information
export async function getSeatInfo(
  purchasedSeats: number,
  usedSeats: number,
  isAdmin: boolean
): Promise<{
  purchased: number;
  used: number;
  available: number;
  monthlyCost: number;
  isAdmin: boolean;
}> {
  const available = purchasedSeats - usedSeats;
  const monthlyCost = isAdmin ? 0 : purchasedSeats * SEAT_PRICE; // Admins don't pay

  return {
    purchased: purchasedSeats,
    used: usedSeats,
    available,
    monthlyCost,
    isAdmin,
  };
}

// Helper: Calculate monthly cost
export function calculateMonthlyCost(seats: number, isAdmin: boolean): number {
  return isAdmin ? 0 : seats * SEAT_PRICE;
}

// Helper: Check if quantity is valid
export function isValidSeatQuantity(quantity: number): boolean {
  return quantity >= 1 && quantity <= MAX_SEATS;
}

// Helper: Get max seats
export function getMaxSeats(): number {
  return MAX_SEATS;
}

// Helper: Get seat price
export function getSeatPrice(): number {
  return SEAT_PRICE;
}