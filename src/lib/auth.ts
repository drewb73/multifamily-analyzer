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