// FILE LOCATION: /src/components/dealiq/ActivityLogTab.tsx
// PURPOSE: Activity log showing combined timeline of notes and auto-tracked changes

'use client'

import { 
  Clock, 
  FileText, 
  Edit, 
  User,
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
  Calculator,
  BadgeDollarSign
} from 'lucide-react'

interface Note {
  id: string
  content: string
  userId: string
  user: {
    email: string
    firstName: string | null
    lastName: string | null
  }
  createdAt: Date
  updatedAt: Date
}

interface Change {
  id: string
  fieldName: string
  previousValue: string
  newValue: string
  userId: string
  user: {
    email: string
    firstName: string | null
    lastName: string | null
  }
  createdAt: Date
}

interface ActivityLogTabProps {
  notes: Note[]
  changes: Change[]
  currentUserEmail: string
}

type ActivityItem = 
  | { type: 'note'; data: Note; timestamp: Date }
  | { type: 'change'; data: Change; timestamp: Date }

export function ActivityLogTab({ notes, changes, currentUserEmail }: ActivityLogTabProps) {
  // Combine notes and changes into single timeline
  const activities: ActivityItem[] = [
    ...notes.map(note => ({ 
      type: 'note' as const, 
      data: note, 
      timestamp: new Date(note.createdAt) 
    })),
    ...changes.map(change => ({ 
      type: 'change' as const, 
      data: change, 
      timestamp: new Date(change.createdAt) 
    }))
  ]

  // Sort by newest first
  const sortedActivities = activities.sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  )

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    if (seconds < 60) return 'Just now'
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
    if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
    return `${years} year${years === 1 ? '' : 's'} ago`
  }

  // Get user display name
  const getUserName = (user: { email: string; firstName: string | null; lastName: string | null } | undefined) => {
    if (!user) return 'Unknown User'
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    if (user.firstName) return user.firstName
    if (user.lastName) return user.lastName
    return user.email
  }

  // Get field display name
  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      stage: 'Stage',
      forecastStatus: 'Forecast Status',
      expectedCloseDate: 'Expected Close Date',
      commissionPercent: 'Commission %',
      netValue: 'Net Value',
      loanRate: 'Loan Rate',
      loanTerm: 'Loan Term'
    }
    return labels[fieldName] || fieldName
  }

  // Get icon for field change
  const getFieldIcon = (fieldName: string) => {
    const icons: Record<string, typeof TrendingUp> = {
      stage: TrendingUp,
      forecastStatus: TrendingUp,
      expectedCloseDate: Calendar,
      commissionPercent: Percent,
      netValue: BadgeDollarSign,
      loanRate: DollarSign,
      loanTerm: Calculator
    }
    const Icon = icons[fieldName] || Edit
    return Icon
  }

  // Format field value for display
  const formatValue = (fieldName: string, value: string): string => {
    if (!value || value === 'null') return 'Not set'

    // Format dates
    if (fieldName === 'expectedCloseDate') {
      try {
        const date = new Date(value)
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
      } catch {
        return value
      }
    }

    // Format percentages
    if (fieldName === 'commissionPercent' || fieldName === 'loanRate') {
      return `${parseFloat(value).toFixed(2)}%`
    }

    // Format currency
    if (fieldName === 'netValue') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(parseFloat(value))
    }

    // Format loan term
    if (fieldName === 'loanTerm') {
      return `${value} years`
    }

    // Stage labels
    if (fieldName === 'stage') {
      const stages: Record<string, string> = {
        prospect: 'Prospecting',
        qualification: 'Lead Qualification',
        analysis: 'Property Analysis',
        offer: 'Offer Submitted',
        negotiation: 'Negotiation',
        diligence: 'Due Diligence',
        closing: 'Closing',
        closed: 'Closed Won',
        lost: 'Closed Lost',
        hold: 'On Hold'
      }
      return stages[value] || value
    }

    // Forecast labels
    if (fieldName === 'forecastStatus') {
      const forecasts: Record<string, string> = {
        'n/a': 'Non Forecastable',
        commit: 'Commit',
        upside: 'Upside',
        most_likely: 'Most Likely'
      }
      return forecasts[value] || value
    }

    return value
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-neutral-900">Activity Log</h3>
        <p className="text-sm text-neutral-600">
          Complete timeline of all deal activity and changes
        </p>
      </div>

      {/* Timeline */}
      {sortedActivities.length === 0 ? (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
          <Clock className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-neutral-900 mb-2">No activity yet</h4>
          <p className="text-neutral-600">
            Activity will appear here as you work on this deal
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-neutral-200" />

          {/* Activity Items */}
          <div className="space-y-6">
            {sortedActivities.map((activity, index) => {
              const isNote = activity.type === 'note'
              const user = activity.data.user
              const userName = getUserName(user)
              const isOwnActivity = user?.email === currentUserEmail

              return (
                <div key={`${activity.type}-${activity.data.id}`} className="relative pl-12">
                  {/* Timeline Dot */}
                  <div className={`absolute left-3.5 w-3 h-3 rounded-full border-2 ${
                    isNote 
                      ? 'bg-primary-600 border-primary-600' 
                      : 'bg-white border-neutral-400'
                  }`} />

                  {/* Activity Card */}
                  <div className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isNote ? 'bg-primary-100' : 'bg-neutral-100'
                        }`}>
                          {isNote ? (
                            <FileText className={`w-5 h-5 ${isNote ? 'text-primary-600' : 'text-neutral-600'}`} />
                          ) : (
                            (() => {
                              const Icon = getFieldIcon((activity.data as Change).fieldName)
                              return <Icon className="w-5 h-5 text-neutral-600" />
                            })()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-semibold text-neutral-900">
                              {userName}
                            </h4>
                            {isOwnActivity && (
                              <span className="text-xs text-neutral-500">(You)</span>
                            )}
                            {isNote ? (
                              <span className="text-sm text-neutral-600">added a note</span>
                            ) : (
                              <span className="text-sm text-neutral-600">
                                updated <span className="font-medium">{getFieldLabel((activity.data as Change).fieldName)}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatRelativeTime(activity.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="ml-13">
                      {isNote ? (
                        // Note content
                        <div className="text-neutral-700 whitespace-pre-wrap">
                          {(activity.data as Note).content}
                        </div>
                      ) : (
                        // Change details
                        <div className="flex items-center gap-2 text-sm">
                          <span className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded font-medium">
                            {formatValue((activity.data as Change).fieldName, (activity.data as Change).previousValue)}
                          </span>
                          <span className="text-neutral-400">→</span>
                          <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded font-medium">
                            {formatValue((activity.data as Change).fieldName, (activity.data as Change).newValue)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}