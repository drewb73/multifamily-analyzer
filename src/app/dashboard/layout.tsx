// src/app/dashboard/layout.tsx
import type { Metadata } from "next";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { getCurrentDbUser } from "@/lib/auth";
import { getEffectiveSubscriptionStatus, getTrialHoursRemaining } from "@/lib/subscription";
import { redirect } from 'next/navigation';
import "../globals.css";

export const metadata: Metadata = {
  title: "Dashboard - PropertyAnalyzer",
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar 
          userSubscriptionStatus={effectiveStatus}
          trialHoursRemaining={trialHoursRemaining}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}