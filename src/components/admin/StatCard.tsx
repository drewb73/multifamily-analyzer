// COMPLETE FILE - FIXED STATCARD COMPONENT
// Location: src/components/admin/StatCard.tsx
// Action: REPLACE ENTIRE FILE
// ✅ Fixed icon bleeding at 1024px
// ✅ Fixed text overflow
// ✅ Responsive sizing

import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'teal'
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    icon: 'text-blue-600',
    trend: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-100',
    icon: 'text-green-600',
    trend: 'text-green-600'
  },
  yellow: {
    bg: 'bg-yellow-100',
    icon: 'text-yellow-600',
    trend: 'text-yellow-600'
  },
  red: {
    bg: 'bg-red-100',
    icon: 'text-red-600',
    trend: 'text-red-600'
  },
  purple: {
    bg: 'bg-purple-100',
    icon: 'text-purple-600',
    trend: 'text-purple-600'
  },
  teal: {
    bg: 'bg-teal-100',
    icon: 'text-teal-600',
    trend: 'text-teal-600'
  }
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  trend,
  color = 'blue' 
}: StatCardProps) {
  const colors = colorClasses[color]

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-neutral-200 hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        {/* Left side - Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-neutral-600 mb-1 truncate">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2 break-words">
            {value}
          </p>
          
          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-500 line-clamp-2">
              {subtitle}
            </p>
          )}
          
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs sm:text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs sm:text-sm text-neutral-500 truncate">
                {trend.label}
              </span>
            </div>
          )}
        </div>
        
        {/* Right side - Icon (fixed size, won't bleed) */}
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  )
}