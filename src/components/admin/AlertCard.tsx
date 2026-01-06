// COMPLETE FILE
// Location: src/components/admin/AlertCard.tsx
// Action: CREATE NEW FILE

import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'

interface AlertCardProps {
  title: string
  count: number
  description: string
  type?: 'info' | 'warning' | 'error' | 'success'
  actionLink?: string
}

const alertStyles = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Info,
    iconColor: 'text-blue-600',
    textColor: 'text-blue-900',
    descColor: 'text-blue-700'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    textColor: 'text-yellow-900',
    descColor: 'text-yellow-700'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: XCircle,
    iconColor: 'text-red-600',
    textColor: 'text-red-900',
    descColor: 'text-red-700'
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    textColor: 'text-green-900',
    descColor: 'text-green-700'
  }
}

export function AlertCard({ 
  title, 
  count, 
  description, 
  type = 'info',
  actionLink 
}: AlertCardProps) {
  const styles = alertStyles[type]
  const Icon = styles.icon

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold ${styles.textColor}`}>{title}</h3>
            <span className={`px-2 py-0.5 text-xs font-bold ${styles.textColor} bg-white rounded-full`}>
              {count}
            </span>
          </div>
          <p className={`text-sm ${styles.descColor}`}>{description}</p>
          {actionLink && (
            <a 
              href={actionLink}
              className={`text-sm font-medium ${styles.iconColor} hover:underline mt-2 inline-block`}
            >
              View details →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}