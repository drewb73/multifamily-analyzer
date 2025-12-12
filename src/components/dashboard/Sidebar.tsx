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

const navItems = [
  {
    name: 'Analyze Property',
    href: '/dashboard',
    icon: Home,
    current: true,
  },
  {
    name: 'Saved Analyses',
    href: '/dashboard/saved',
    icon: FileText,
    current: false,
    locked: true,
  },
  {
    name: 'Contact Support',
    href: '/dashboard/contact',
    icon: Mail,
    current: false,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    current: false,
  },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

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

      {/* Trial Status Banner */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-lg bg-warning-50 border border-warning-200 p-3">
            <div className="flex items-center">
              <Lock className="h-4 w-4 text-warning-600 mr-2" />
              <div className="text-xs">
                <div className="font-medium text-warning-700">Free Trial</div>
                <div className="text-warning-600">72 hours remaining</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}