import type { Metadata } from "next";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { getCurrentDbUser } from "@/lib/auth";
import { getEffectiveSubscriptionStatus, getTrialHoursRemaining } from "@/lib/subscription";
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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar 
          userSubscriptionStatus={effectiveStatus}
          trialHoursRemaining={trialHoursRemaining}
        />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}