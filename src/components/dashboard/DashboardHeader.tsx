'use client'

import { useClerk } from '@clerk/nextjs'
import { LogOut } from 'lucide-react'
// import { Bell, HelpCircle } from 'lucide-react' // Commented out - not using

export default function DashboardHeader() {
  const { signOut } = useClerk()

  const handleLogout = async () => {
    await signOut({ redirectUrl: '/' })
  }

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
          {/* Help - Commented out for now */}
          {/*
          <button
            className="p-2 text-neutral-500 hover:text-neutral-700 rounded-full hover:bg-neutral-100"
            title="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          */}

          {/* Notifications - Commented out for now */}
          {/*
          <button
            className="p-2 text-neutral-500 hover:text-neutral-700 rounded-full hover:bg-neutral-100 relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary-500"></span>
          </button>
          */}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  )
}