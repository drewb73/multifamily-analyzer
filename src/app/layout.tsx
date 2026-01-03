import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";
import { AdminMaintenanceBanner } from '@/components/AdminMaintenanceBanner'
import { getSystemSettings } from '@/lib/settings'
import { getCurrentDbUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: "PropertyAnalyzer - Multifamily Investment Analysis",
  description: "Professional multifamily property analysis made simple",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check system settings
  const systemSettings = await getSystemSettings()
  const dbUser = await getCurrentDbUser()
  const isAdmin = dbUser?.isAdmin || false

  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {/* Show admin banner if maintenance mode is on and user is admin */}
          {systemSettings.maintenanceMode && isAdmin && <AdminMaintenanceBanner />}
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}