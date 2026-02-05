// COMPLETE FILE - DASHBOARD LAYOUT WITH MOBILE MENU STATE
// Location: src/app/dashboard/layout.tsx
// Action: REPLACE ENTIRE FILE
// ✅ Manages mobile menu open/close state
// ✅ Passes state between header and sidebar
// ✅ Client component wrapper for state management

import type { Metadata } from "next";
import { MaintenanceLock } from "@/components/dashboard/MaintenanceLock";
import { getCurrentDbUser } from "@/lib/auth";
import { getEffectiveSubscriptionStatus, getTrialHoursRemaining } from "@/lib/subscription";
import { getSystemSettings } from "@/lib/settings";
import { redirect } from 'next/navigation';
import "../globals.css";
import DashboardLayoutClient from "@/components/dashboard/DashboardLayoutClient";

export const metadata: Metadata = {
  title: "Dashboard - NumexRE",
  description: "Your multifamily property analysis dashboard",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch user data
  const dbUser = await getCurrentDbUser();
  
  // Check if account is marked for deletion or deleted
  if (dbUser && (dbUser.accountStatus === 'pending_deletion' || dbUser.accountStatus === 'deleted')) {
    redirect('/account-deleted');
  }

  // Check system settings
  const systemSettings = await getSystemSettings();
  
  // If dashboard is disabled and user is NOT an admin, show maintenance
  if (!systemSettings.dashboardEnabled && dbUser && !dbUser.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <MaintenanceLock 
            feature="Dashboard" 
            message="The dashboard is temporarily unavailable while we perform maintenance. Please check back soon."
          />
        </div>
      </div>
    );
  }
  
  // Get effective subscription status
  const effectiveStatus = dbUser ? getEffectiveSubscriptionStatus(
    dbUser.subscriptionStatus as any,
    dbUser.trialEndsAt,
    dbUser.hasUsedTrial
  ) : 'free';

  // Calculate trial hours remaining
  const trialHoursRemaining = dbUser?.trialEndsAt 
    ? getTrialHoursRemaining(dbUser.trialEndsAt)
    : 0;

  return (
    <DashboardLayoutClient
      userSubscriptionStatus={effectiveStatus}
      trialHoursRemaining={trialHoursRemaining}
    >
      {children}
    </DashboardLayoutClient>
  );
}