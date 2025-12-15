import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PropertyAnalyzer - Multifamily Investment Analysis",
  description: "Professional multifamily property analysis tool for real estate investors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#0f172a", // slate-900 - your primary color
          colorBackground: "#ffffff",
          colorText: "#0f172a",
          colorTextSecondary: "#64748b",
          colorInputBackground: "#ffffff",
          colorInputText: "#0f172a",
          borderRadius: "0.5rem",
        },
        elements: {
          // Remove Clerk branding
          footer: "hidden",
          
          // Card styling
          card: "shadow-xl border border-slate-200",
          
          // Form elements
          formButtonPrimary: 
            "bg-slate-900 hover:bg-slate-800 text-white normal-case font-medium transition-colors",
          
          formFieldInput: 
            "border-slate-300 focus:border-slate-900 focus:ring-slate-900",
          
          // Header
          headerTitle: "text-slate-900 font-bold text-2xl",
          headerSubtitle: "text-slate-600",
          
          // Social buttons
          socialButtonsBlockButton: 
            "border-slate-300 hover:bg-slate-50",
          
          // Links
          formFieldLabel: "text-slate-700 font-medium",
          footerActionLink: "text-slate-900 hover:text-slate-700",
          
          // Divider
          dividerLine: "bg-slate-200",
          dividerText: "text-slate-500",
          
          // User button
          userButtonPopoverCard: "shadow-xl border border-slate-200",
          userButtonPopoverActionButton: "hover:bg-slate-50",
        },
      }}
    >
      <html lang="en">
        <body className={`${inter.className} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}