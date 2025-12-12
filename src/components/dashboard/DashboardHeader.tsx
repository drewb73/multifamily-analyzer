'use client'

import { User, Bell, HelpCircle } from 'lucide-react'
import { useState } from 'react'

export default function DashboardHeader() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

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
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-neutral-500 hover:text-neutral-700 rounded-full hover:bg-neutral-100 relative"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary-500"></span>
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-neutral-200 bg-white py-2 shadow-lg">
                <div className="px-4 py-2">
                  <div className="font-medium text-neutral-900">Notifications</div>
                  <div className="text-sm text-neutral-500">No new notifications</div>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 rounded-lg border border-neutral-200 px-3 py-2 hover:bg-neutral-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-neutral-900">Trial User</div>
                <div className="text-xs text-neutral-500">Free Trial</div>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-neutral-200 bg-white py-2 shadow-lg">
                <div className="px-4 py-2 border-b border-neutral-100">
                  <div className="text-sm font-medium text-neutral-900">Trial User</div>
                  <div className="text-xs text-neutral-500">user@example.com</div>
                </div>
                <button className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50">
                  Upgrade Account
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50">
                  Account Settings
                </button>
                <div className="border-t border-neutral-100">
                  <button className="w-full px-4 py-2 text-left text-sm text-error-600 hover:bg-error-50">
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}