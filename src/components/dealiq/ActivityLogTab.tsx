// FILE LOCATION: /src/components/dealiq/ActivityLogTab.tsx
// PURPOSE: Activity log with table view showing Date, Field, and Event (old -> new)

'use client'

import { 
  Clock
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

  // Format date as MM/DD/YYYY
  const formatDate = (date: Date) => {
    const d = new Date(date)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const year = d.getFullYear()
    return `${month}/${day}/${year}`
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
      loanTerm: 'Loan Term',
      price: 'Expected Purchase Price',
      address: 'Address',
      city: 'City',
      state: 'State',
      zipCode: 'ZIP Code',
      units: 'Units',
      squareFeet: 'Square Feet'
    }
    return labels[fieldName] || fieldName
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
    if (fieldName === 'netValue' || fieldName === 'price') {
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

    // Format units
    if (fieldName === 'units') {
      return `${value} units`
    }

    // Format square feet
    if (fieldName === 'squareFeet') {
      return `${parseFloat(value).toLocaleString()} sq ft`
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

      {/* Activity Table */}
      {sortedActivities.length === 0 ? (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
          <Clock className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-neutral-900 mb-2">No activity yet</h4>
          <p className="text-neutral-600">
            Activity will appear here as you work on this deal
          </p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-32">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-48">
                    Field
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Event
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {sortedActivities.map((activity) => {
                  const isNote = activity.type === 'note'

                  return (
                    <tr key={`${activity.type}-${activity.data.id}`} className="hover:bg-neutral-50">
                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap align-top">
                        <div className="text-sm font-medium text-neutral-900">
                          {formatDate(activity.timestamp)}
                        </div>
                      </td>

                      {/* Field */}
                      <td className="px-6 py-4 whitespace-nowrap align-top">
                        <div className="text-sm text-neutral-700">
                          {isNote ? (
                            <span className="font-medium text-primary-600">Note</span>
                          ) : (
                            getFieldLabel((activity.data as Change).fieldName)
                          )}
                        </div>
                      </td>

                      {/* Event */}
                      <td className="px-6 py-4 align-top">
                        {isNote ? (
                          <div className="text-sm text-neutral-700 whitespace-pre-wrap break-words">
                            {(activity.data as Note).content}
                          </div>
                        ) : (
                          <div className="text-sm text-neutral-700">
                            <span className="text-neutral-500">
                              {formatValue(
                                (activity.data as Change).fieldName,
                                (activity.data as Change).previousValue
                              )}
                            </span>
                            <span className="mx-2 text-neutral-400">→</span>
                            <span className="font-medium text-neutral-900">
                              {formatValue(
                                (activity.data as Change).fieldName,
                                (activity.data as Change).newValue
                              )}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}