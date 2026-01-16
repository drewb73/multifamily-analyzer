// FILE LOCATION: /src/components/dashboard/Sidebar.tsx
// UPDATED: Added DealIQ CRM menu item

'use client'

import { useState } from 'react'
import { 
  Home, 
  FileText, 
  Lock, 
  Mail, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Briefcase // ← ADDED
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { useClerk } from '@clerk/nextjs'

interface DashboardSidebarProps {
  userSubscriptionStatus: string | null
  trialHoursRemaining?: number
  mobileMenuOpen?: boolean
  onMobileMenuClose?: () => void
}

export default function DashboardSidebar({ 
  userSubscriptionStatus,
  trialHoursRemaining,
  mobileMenuOpen = false,
  onMobileMenuClose
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { settings: systemSettings } = useSystemSettings()
  const { signOut } = useClerk()

  // Determine what's locked based on subscription
  const isPremium = userSubscriptionStatus === 'premium' || userSubscriptionStatus === 'enterprise'
  const isTrial = userSubscriptionStatus === 'trial'
  const isFree = !isPremium && !isTrial

  const navItems = [
    {
      name: 'Analyze Property',
      href: '/dashboard',
      icon: Home,
      locked: isFree || !systemSettings?.analysisEnabled,
    },
    {
      name: 'Saved Analyses',
      href: '/dashboard/saved',
      icon: FileText,
      locked: !isPremium || !systemSettings?.savedDraftsEnabled,
    },
    // ← ADDED: DealIQ CRM menu item
    {
      name: 'DealIQ',
      href: '/dashboard/dealiq',
      icon: Briefcase,
      locked: !isPremium || !systemSettings?.dealiqEnabled,
    },
    {
      name: 'Contact Support',
      href: '/dashboard/contact',
      icon: Mail,
      locked: false,
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      locked: false,
    },
  ]

  const handleLogout = async () => {
    await signOut({ redirectUrl: '/' })
  }

  const handleLinkClick = () => {
    // Close mobile menu when a link is clicked
    if (onMobileMenuClose) {
      onMobileMenuClose()
    }
  }

  // Subscription Status Component (reusable for both desktop and mobile)
  const SubscriptionStatus = () => (
    <div className="p-4">
      {isTrial && trialHoursRemaining !== undefined && (
        <div className="rounded-lg bg-warning-50 border border-warning-200 p-3">
          <div className="flex items-center">
            <Lock className="h-4 w-4 text-warning-600 mr-2 flex-shrink-0" />
            <div className="text-xs">
              <div className="font-medium text-warning-700">Free Trial</div>
              <div className="text-warning-600">
                {trialHoursRemaining} hour{trialHoursRemaining !== 1 ? 's' : ''} remaining
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isFree && (
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
          <div className="flex items-center">
            <Lock className="h-4 w-4 text-neutral-600 mr-2 flex-shrink-0" />
            <div className="text-xs">
              <div className="font-medium text-neutral-700">Free Account</div>
              <div className="text-neutral-600">Upgrade to unlock features</div>
            </div>
          </div>
        </div>
      )}
      
      {isPremium && (
        <div className="rounded-lg bg-success-50 border border-success-200 p-3">
          <div className="flex items-center">
            <div className="text-xs">
              <div className="font-medium text-success-700">⭐ Premium Account</div>
              <div className="text-success-600">All features unlocked</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* ============================================ */}
      {/* MOBILE: Overlay (when menu is open) */}
      {/* ============================================ */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileMenuClose}
        />
      )}

      {/* ============================================ */}
      {/* MOBILE: Slide-out Menu */}
      {/* ============================================ */}
      <div 
        className={`
          fixed top-16 left-0 bottom-0 w-64 bg-white z-40
          transform transition-transform duration-300 ease-in-out
          lg:hidden border-r border-neutral-200
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-start border-b border-neutral-200 p-4">
          <div className="flex items-center">
            <div className="text-2xl">🏢</div>
            <h1 className="ml-3 text-xl font-display font-bold text-primary-600 truncate">
              PropertyAnalyzer
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={`
                  flex items-center rounded-lg px-3 py-2.5 text-sm font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500' 
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }
                `}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-neutral-400'}`} />
                  {item.locked && (
                    <Lock className="absolute -top-1 -right-1 h-3 w-3 text-warning-500" />
                  )}
                </div>
                <span className="ml-3 truncate">{item.name}</span>
                {item.locked && (
                  <Lock className="ml-auto h-4 w-4 text-warning-500" />
                )}
              </Link>
            )
          })}

          {/* Sign Out Button (Mobile Only) */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all duration-200 mt-2"
          >
            <LogOut className="h-5 w-5 text-neutral-400" />
            <span className="ml-3 truncate">Sign Out</span>
          </button>
        </nav>

        {/* Subscription Status Banner (Mobile) */}
        <div className="absolute bottom-4 left-0 right-0">
          <SubscriptionStatus />
        </div>
      </div>

      {/* ============================================ */}
      {/* DESKTOP: Regular Sidebar (hidden on mobile) */}
      {/* ============================================ */}
      <div className={`
        hidden lg:block
        relative min-h-screen border-r border-neutral-200 bg-white
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}>
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center
                   rounded-full border border-neutral-200 bg-white shadow-sm
                   hover:bg-neutral-50 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-neutral-500" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-neutral-500" />
          )}
        </button>

        {/* Logo */}
        <div className={`
          flex items-center border-b border-neutral-200 p-4
          ${isCollapsed ? 'justify-center' : 'justify-start'}
        `}>
          <div className="flex items-center">
            <div className="text-2xl">🏢</div>
            {!isCollapsed && (
              <h1 className="ml-3 text-xl font-display font-bold text-primary-600 truncate">
                PropertyAnalyzer
              </h1>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center rounded-lg px-3 py-2.5 text-sm font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500' 
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }
                  ${isCollapsed ? 'justify-center' : 'justify-start'}
                `}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-neutral-400'}`} />
                  {item.locked && (
                    <Lock className="absolute -top-1 -right-1 h-3 w-3 text-warning-500" />
                  )}
                </div>
                
                {!isCollapsed && (
                  <>
                    <span className="ml-3 truncate">{item.name}</span>
                    {item.locked && (
                      <Lock className="ml-auto h-4 w-4 text-warning-500" />
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Subscription Status Banner (Desktop) */}
        {!isCollapsed && (
          <div className="absolute bottom-4 left-4 right-4">
            {isTrial && trialHoursRemaining !== undefined && (
              <div className="rounded-lg bg-warning-50 border border-warning-200 p-3">
                <div className="flex items-center">
                  <Lock className="h-4 w-4 text-warning-600 mr-2 flex-shrink-0" />
                  <div className="text-xs">
                    <div className="font-medium text-warning-700">Free Trial</div>
                    <div className="text-warning-600">
                      {trialHoursRemaining} hour{trialHoursRemaining !== 1 ? 's' : ''} remaining
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {isFree && (
              <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                <div className="flex items-center">
                  <Lock className="h-4 w-4 text-neutral-600 mr-2 flex-shrink-0" />
                  <div className="text-xs">
                    <div className="font-medium text-neutral-700">Free Account</div>
                    <div className="text-neutral-600">Upgrade to unlock features</div>
                  </div>
                </div>
              </div>
            )}
            
            {isPremium && (
              <div className="rounded-lg bg-success-50 border border-success-200 p-3">
                <div className="flex items-center">
                  <div className="text-xs">
                    <div className="font-medium text-success-700">⭐ Premium Account</div>
                    <div className="text-success-600">All features unlocked</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}