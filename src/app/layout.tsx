import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";
import { AdminMaintenanceBanner } from '@/components/AdminMaintenanceBanner'

export const metadata: Metadata = {
  title: "PropertyAnalyzer - Multifamily Investment Analysis",
  description: "Professional multifamily property analysis made simple",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {/* Client-side banner that polls for maintenance mode */}
          <AdminMaintenanceBanner />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}