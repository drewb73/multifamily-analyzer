// FILE LOCATION: /src/app/nreadr/expirations/page.tsx
// PURPOSE: Manual trigger page for all automated expiration tasks

'use client'

import { useState } from 'react'
import { 
  Clock,
  Users,
  CreditCard,
  Trash2,
  MessageSquare,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Zap,
  PlayCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface TaskDetail {
  email?: string
  name?: string
  message?: string
  code?: string
  status: 'success' | 'failed'
  error?: string
  expiredHoursAgo?: number
  expiredDaysAgo?: number
  daysAgo?: number
  previousStatus?: string
  source?: string
  type?: string
  targetAudience?: string
}

interface TaskResult {
  total: number
  success: number
  failed: number
  details: TaskDetail[]
}

interface ExpirationResults {
  success: boolean
  message: string
  triggeredBy: string
  timestamp: string
  tasks: {
    trials?: TaskResult
    subscriptions?: TaskResult
    accounts?: TaskResult
    banners?: TaskResult
  }
}

const TASKS = [
  {
    id: 'trials',
    title: 'Trial Expiration',
    description: 'Downgrade expired trial users to free tier',
    icon: Users,
    color: 'warning',
    detail: 'Finds users with subscriptionStatus="trial" where trialEndsAt < now'
  },
  {
    id: 'subscriptions',
    title: 'Subscription Expiration',
    description: 'Downgrade expired manual subscriptions (not Stripe)',
    icon: CreditCard,
    color: 'purple',
    detail: 'Finds manual premium/enterprise users where subscriptionEndsAt < now'
  },
  {
    id: 'accounts',
    title: 'Account Deletion',
    description: 'Permanently delete accounts marked for deletion 60+ days ago',
    icon: Trash2,
    color: 'error',
    detail: 'Finds users with accountStatus="pending_deletion" marked 60+ days ago'
  },
  {
    id: 'banners',
    title: 'Banner Expiration',
    description: 'Deactivate expired banners',
    icon: MessageSquare,
    color: 'blue',
    detail: 'Finds active banners where endDate < now'
  }
]

export default function TriggerExpirationsPage() {
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [results, setResults] = useState<ExpirationResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const triggerTask = async (taskType: string) => {
    setIsProcessing(taskType)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/nreadr/trigger-expirations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskType })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger expirations')
      }

      setResults(data)
    } catch (err: any) {
      console.error('Expiration trigger error:', err)
      setError(err.message || 'Failed to trigger expirations')
    } finally {
      setIsProcessing(null)
    }
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, any> = {
      warning: {
        bg: 'bg-warning-100',
        text: 'text-warning-700',
        border: 'border-warning-200',
        hover: 'hover:bg-warning-50'
      },
      purple: {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-50'
      },
      error: {
        bg: 'bg-error-100',
        text: 'text-error-700',
        border: 'border-error-200',
        hover: 'hover:bg-error-50'
      },
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-50'
      }
    }
    return colors[color] || colors.blue
  }

  const renderTaskResults = (taskId: string, taskResult: TaskResult | undefined) => {
    if (!taskResult) return null

    const isExpanded = expandedTask === taskId
    const hasDetails = taskResult.details && taskResult.details.length > 0

    return (
      <div className="mt-4 p-4 bg-white rounded-lg border border-neutral-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success-600" />
            <div>
              <p className="font-medium text-neutral-900">
                {taskResult.total === 0 ? 'Nothing to process' : `Processed ${taskResult.total} item${taskResult.total === 1 ? '' : 's'}`}
              </p>
              <div className="flex gap-4 mt-1 text-sm">
                {taskResult.success > 0 && (
                  <span className="text-success-700">
                    Success: <strong>{taskResult.success}</strong>
                  </span>
                )}
                {taskResult.failed > 0 && (
                  <span className="text-error-700">
                    Failed: <strong>{taskResult.failed}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {hasDetails && (
            <button
              onClick={() => setExpandedTask(isExpanded ? null : taskId)}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show Details
                </>
              )}
            </button>
          )}
        </div>

        {isExpanded && hasDetails && (
          <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4">
            {taskResult.details.map((detail, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  detail.status === 'success'
                    ? 'bg-success-50 border-success-200'
                    : 'bg-error-50 border-error-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {detail.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-error-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-neutral-900 truncate">
                      {detail.name || detail.email || detail.message}
                    </p>
                    {detail.email && detail.name && (
                      <p className="text-xs text-neutral-600 truncate">{detail.email}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {detail.expiredDaysAgo !== undefined && (
                        <span className="text-xs text-neutral-500">
                          Expired {detail.expiredDaysAgo}d ago
                        </span>
                      )}
                      {detail.daysAgo !== undefined && (
                        <span className="text-xs text-neutral-500">
                          Marked {detail.daysAgo}d ago
                        </span>
                      )}
                      {detail.previousStatus && (
                        <span className="text-xs text-neutral-500">
                          Was: {detail.previousStatus}
                        </span>
                      )}
                      {detail.source && (
                        <span className="text-xs text-neutral-500">
                          Source: {detail.source}
                        </span>
                      )}
                      {detail.type && (
                        <span className="text-xs text-neutral-500">
                          Type: {detail.type}
                        </span>
                      )}
                      {detail.targetAudience && (
                        <span className="text-xs text-neutral-500">
                          Audience: {detail.targetAudience}
                        </span>
                      )}
                    </div>
                    {detail.error && (
                      <p className="text-xs text-error-600 mt-1">Error: {detail.error}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Trigger Expirations</h1>
        <p className="text-neutral-600 mt-1">
          Manually trigger automated expiration tasks. Use for testing or when cron jobs fail.
        </p>
      </div>

      {/* Run All Button */}
      <div className="elevated-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">Run All Tasks</h3>
              <p className="text-sm text-neutral-600">Execute all expiration checks at once</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => triggerTask('all')}
          disabled={isProcessing !== null}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            isProcessing
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isProcessing === 'all' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing All Tasks...
            </>
          ) : (
            <>
              <PlayCircle className="w-5 h-5" />
              Run All Expirations
            </>
          )}
        </button>
      </div>

      {/* Individual Task Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {TASKS.map((task) => {
          const colors = getColorClasses(task.color)
          const Icon = task.icon
          const taskResult = results?.tasks[task.id as keyof typeof results.tasks]

          return (
            <div key={task.id} className="elevated-card p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900">{task.title}</h3>
                  <p className="text-sm text-neutral-600 mt-1">{task.description}</p>
                  <p className="text-xs text-neutral-500 mt-2 italic">{task.detail}</p>

                  <button
                    onClick={() => triggerTask(task.id)}
                    disabled={isProcessing !== null}
                    className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      isProcessing
                        ? 'bg-neutral-50 text-neutral-400 border-neutral-200 cursor-not-allowed'
                        : `${colors.bg} ${colors.text} ${colors.border} ${colors.hover}`
                    }`}
                  >
                    {isProcessing === task.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        Run This Task
                      </>
                    )}
                  </button>

                  {/* Show results for this task */}
                  {taskResult && renderTaskResults(task.id, taskResult)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Global Error Message */}
      {error && (
        <div className="elevated-card p-6 border-error-200 bg-error-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-error-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-error-900">Error</p>
              <p className="text-sm text-error-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {results && (
        <div className="elevated-card p-6 bg-success-50 border-success-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-success-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-success-900">{results.message}</p>
              <p className="text-sm text-success-700 mt-1">
                Triggered by: {results.triggeredBy}
              </p>
              <p className="text-xs text-success-600 mt-1">
                {new Date(results.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="elevated-card p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">About Expiration Triggers</p>
            <p className="text-sm text-blue-700 mt-2">
              These tasks normally run automatically via middleware when users visit the site.
              Use this page to manually trigger expirations for testing or when automatic
              processes need a boost.
            </p>
            <p className="text-sm text-blue-700 mt-2">
              <strong>Production:</strong> Set up cron-job.org to call these endpoints
              automatically every hour for guaranteed expiration processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}