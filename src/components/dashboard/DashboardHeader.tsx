// COMPLETE FILE - MOBILE-FRIENDLY DASHBOARD HEADER
// Location: src/components/dashboard/DashboardHeader.tsx
// Action: REPLACE ENTIRE FILE
// ✅ Added hamburger menu button for mobile
// ✅ Compact design for small screens
// ✅ Passes mobile menu state to parent

'use client'

import { useClerk } from '@clerk/nextjs'
import { LogOut, Menu, X } from 'lucide-react'

interface DashboardHeaderProps {
  mobileMenuOpen?: boolean
  onMobileMenuToggle?: () => void
}

export default function DashboardHeader({ 
  mobileMenuOpen = false, 
  onMobileMenuToggle 
}: DashboardHeaderProps) {
  const { signOut } = useClerk()

  const handleLogout = async () => {
    await signOut({ redirectUrl: '/' })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left side - Hamburger (mobile) + Logo/Title */}
        <div className="flex items-center gap-3">
          {/* Hamburger Button (Mobile Only) */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-neutral-700" />
            ) : (
              <Menu className="w-6 h-6 text-neutral-700" />
            )}
          </button>

          {/* Logo (Mobile) */}
          <div className="flex items-center lg:hidden">
            <div className="text-2xl">🏢</div>
          </div>

          {/* Title (Desktop) */}
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-neutral-900">
              Property Analysis Dashboard
            </h1>
            <p className="text-sm text-neutral-500">
              Analyze, save, and export your multifamily property analyses
            </p>
          </div>
        </div>

        {/* Right side - Sign Out Button */}
        <div className="flex items-center">
          {/* Desktop Sign Out */}
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>

          {/* Mobile Sign Out (Icon Only) */}
          <button
            onClick={handleLogout}
            className="sm:hidden p-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}