'use client'

import { ReactNode } from 'react'
import Link from 'next/link'

interface NavItemProps {
  href: string
  icon: ReactNode
  label: string
  isActive: boolean
  locked?: boolean
  isCollapsed?: boolean
}

export default function NavItem({ 
  href, 
  icon, 
  label, 
  isActive, 
  locked = false,
  isCollapsed = false 
}: NavItemProps) {
  return (
    <Link
      href={href}
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
        {icon}
        {locked && (
          <span className="absolute -top-1 -right-1 text-warning-500 text-xs">🔒</span>
        )}
      </div>
      
      {!isCollapsed && (
        <>
          <span className="ml-3 truncate">{label}</span>
          {locked && (
            <span className="ml-auto text-warning-500">🔒</span>
          )}
        </>
      )}
    </Link>
  )
}