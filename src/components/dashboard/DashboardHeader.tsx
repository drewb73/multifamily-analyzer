import { getCurrentUser, getCurrentDbUser, getSubscriptionDisplayName, getSubscriptionBadge } from '@/lib/auth';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Bell, HelpCircle } from 'lucide-react';

export default async function DashboardHeader() {
  // Fetch user data from Clerk and MongoDB
  const clerkUser = await getCurrentUser();
  const dbUser = await getCurrentDbUser();

  // Get display names for subscription
  const displayName = getSubscriptionDisplayName(dbUser?.subscriptionStatus || null);
  const badge = getSubscriptionBadge(dbUser?.subscriptionStatus || null);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Breadcrumb/Title */}
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">
            Property Analysis Dashboard
          </h1>
          <p className="text-sm text-neutral-500">
            Analyze, save, and export your multifamily property analyses
          </p>
        </div>

        {/* Right side - User controls */}
        <div className="flex items-center space-x-4">
          {/* Help */}
          <button
            className="p-2 text-neutral-500 hover:text-neutral-700 rounded-full hover:bg-neutral-100"
            title="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <button
            className="p-2 text-neutral-500 hover:text-neutral-700 rounded-full hover:bg-neutral-100 relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary-500"></span>
          </button>

          {/* Clerk User Button with Custom Appearance */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-10 w-10",
                userButtonPopoverCard: "shadow-xl border border-slate-200",
                userButtonPopoverActionButton: "hover:bg-slate-50 text-slate-700",
                userButtonPopoverActionButtonText: "text-slate-700",
                userButtonPopoverActionButtonIcon: "text-slate-500",
                userButtonPopoverFooter: "hidden", // Hide "Manage account" footer with Clerk branding
              },
            }}
          >
            {/* Add custom menu items */}
            <UserButton.MenuItems>
              <UserButton.Link
                label="Upgrade Account"
                labelIcon={<span>⭐</span>}
                href="/pricing"
              />
              <UserButton.Link
                label="Account Settings"
                labelIcon={<span>⚙️</span>}
                href="/dashboard/settings"
              />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </div>
    </header>
  );
}