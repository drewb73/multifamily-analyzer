// UPDATED FILE - REPLACE YOUR ENTIRE src/lib/auth.ts WITH THIS
// Location: src/lib/auth.ts
// Action: REPLACE ENTIRE FILE
// ✅ NOW HANDLES: Both expired trials AND expired subscriptions

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

/**
 * Get the current user from Clerk
 */
export async function getCurrentUser() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  const user = await currentUser();
  return user;
}

/**
 * Get the current user's database record
 * This gives you access to subscription status, trial info, etc.
 * 
 * ✅ NOW INCLUDES: 
 * - Automatic trial expiry detection and database update
 * - Automatic subscription expiry detection and database update
 */
export async function getCurrentDbUser() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return null;
    }

    const now = new Date();
    let needsUpdate = false;
    let newStatus = dbUser.subscriptionStatus;

    // ✅ CHECK 1: Expired Trial
    if (dbUser.subscriptionStatus === 'trial' && dbUser.trialEndsAt) {
      if (dbUser.trialEndsAt < now) {
        console.log(`🔄 Trial expired for user ${dbUser.email}, updating database to free status`);
        needsUpdate = true;
        newStatus = 'free';
      }
    }

    // ✅ CHECK 2: Expired Premium Subscription
    if (dbUser.subscriptionStatus === 'premium' && dbUser.subscriptionEndsAt) {
      if (dbUser.subscriptionEndsAt < now) {
        console.log(`🔄 Premium subscription expired for user ${dbUser.email}, updating database to free status`);
        needsUpdate = true;
        newStatus = 'free';
      }
    }

    // ✅ CHECK 3: Expired Enterprise Subscription (if you use this)
    if (dbUser.subscriptionStatus === 'enterprise' && dbUser.subscriptionEndsAt) {
      if (dbUser.subscriptionEndsAt < now) {
        console.log(`🔄 Enterprise subscription expired for user ${dbUser.email}, updating database to free status`);
        needsUpdate = true;
        newStatus = 'free';
      }
    }

    // If any subscription/trial expired, update the database
    if (needsUpdate) {
      const updatedUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { 
          subscriptionStatus: newStatus as any
        }
      });
      
      console.log(`✅ User ${dbUser.email} updated to ${newStatus} status in database`);
      return updatedUser;
    }

    // Return user as-is if no update needed
    return dbUser;
  } catch (error) {
    console.error("Error fetching user from database:", error);
    return null;
  }
}

/**
 * Get user's subscription tier display name
 */
export function getSubscriptionDisplayName(status: string | null): string {
  switch (status) {
    case "trial":
      return "Trial User";
    case "premium":
      return "Premium User";
    case "enterprise":
      return "Enterprise User";
    case "free":
      return "Free User";
    default:
      return "User";
  }
}

/**
 * Get user's subscription badge text
 */
export function getSubscriptionBadge(status: string | null): string {
  switch (status) {
    case "trial":
      return "Free Trial";
    case "premium":
      return "Premium";
    case "enterprise":
      return "Enterprise";
    case "free":
      return "Free Plan";
    default:
      return "Free Plan";
  }
}

/**
 * Calculate days remaining in trial
 */
export function getTrialDaysRemaining(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  
  const now = new Date();
  const diff = trialEndsAt.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  return days > 0 ? days : 0;
}