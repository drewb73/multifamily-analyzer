// src/app/dashboard/layout.tsx
import type { Metadata } from "next";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import DashboardLayoutClient from "@/components/dashboard/DashboardLayoutClient";
import "../globals.css";

export const metadata: Metadata = {
  title: "Dashboard - PropertyAnalyzer",
  description: "Your multifamily property analysis dashboard",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SubscriptionProvider>
      <DashboardLayoutClient>
        {children}
      </DashboardLayoutClient>
    </SubscriptionProvider>
  );
}