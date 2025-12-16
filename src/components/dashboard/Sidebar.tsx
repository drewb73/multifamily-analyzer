// src/components/dashboard/Sidebar.tsx
'use client'

import { useState } from 'react'
import { 
  Home, 
  FileText, 
  Lock, 
  Mail, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface DashboardSidebarProps {
  userSubscriptionStatus: string | null
  trialHoursRemaining?: number
}

export default function DashboardSidebar({ 
  userSubscriptionStatus,
  trialHoursRemaining 
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Determine what's locked based on subscription
  const isPremium = userSubscriptionStatus === 'premium' || userSubscriptionStatus === 'enterprise'
  const isTrial = userSubscriptionStatus === 'trial'
  const isFree = !isPremium && !isTrial

  const navItems = [
    {
      name: 'Analyze Property',
      href: '/dashboard',
      icon: Home,
      locked: isFree, // Lock for free users
    },
    {
      name: 'Saved Analyses',
      href: '/dashboard/saved',
      icon: FileText,
      locked: !isPremium, // Lock for non-premium users
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

  return (
    <div className={`
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

      {/* Subscription Status Banner */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          {isTrial && trialHoursRemaining !== undefined && (
            <div className="rounded-lg bg-warning-50 border border-warning-200 p-3">
              <div className="flex items-center">
                <Lock className="h-4 w-4 text-warning-600 mr-2" />
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
                <Lock className="h-4 w-4 text-neutral-600 mr-2" />
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
  )
}