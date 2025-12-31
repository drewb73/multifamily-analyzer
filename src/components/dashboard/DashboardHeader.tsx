'use client'

import { UserButton } from '@clerk/nextjs'
import { Bell, HelpCircle } from 'lucide-react'

export default function DashboardHeader() {
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

          {/* Clerk User Button - Simplified without children */}
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-10 w-10",
                userButtonPopoverCard: "shadow-xl border border-slate-200",
                userButtonPopoverActionButton: "hover:bg-slate-50 text-slate-700",
                userButtonPopoverActionButtonText: "text-slate-700",
                userButtonPopoverActionButtonIcon: "text-slate-500",
              },
            }}
          />
        </div>
      </div>
    </header>
  )
}