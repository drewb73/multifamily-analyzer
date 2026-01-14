// COMPLETE FILE - MOBILE FRIENDLY ADMIN DASHBOARD WITH ALL FIXES
// Location: src/app/admin/page.tsx
// Action: REPLACE ENTIRE FILE
// ✅ Mobile-responsive grids
// ✅ Fixed database stats bleeding at 1024px
// ✅ Shows Stripe vs Manual premium users
// ✅ Rounded database size display

'use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  FileText,
  Database,
  Settings,
  UserPlus,
  UserMinus,
  Clock,
  CheckCircle,
  BarChart3
} from 'lucide-react'
import { StatCard } from '@/components/admin/StatCard'
import { AlertCard } from '@/components/admin/AlertCard'
import { UserGrowthChart } from '@/components/admin/UserGrowthChart'

interface DashboardMetrics {
  users: {
    total: number
    premium: number
    premiumStripe: number
    premiumManual: number
    trial: number
    free: number
    active30d: number
    active7d: number
    ratios: {
      premium: number
      trial: number
      free: number
    }
  }
  analyses: {
    total: number
    thisWeek: number
    thisMonth: number
    avgPerUser: number
  }
  revenue: {
    mrr: number
    expectedWeekly: number
    expectedMonthly: number
    cancelledThisMonth: number
    stripePremiumCount: number
    manualPremiumCount: number
  }
  growth: {
    newSignupsWeek: number
    newSignupsMonth: number
    conversionRate: number
    churnRate: number
  }
  alerts: {
    trialsExpiring24h: number
    trialsExpiring7d: number
    pendingDeletions: number
  }
  system: {
    database: {
      totalUsers: number
      totalAnalyses: number
      totalGroups: number
      totalBanners: number
      totalProperties: number
      totalLegacyAnalyses: number
      totalAdminLogs: number
      estimatedSize: string
    }
    features: {
      maintenanceMode: boolean
      dashboardEnabled: boolean
      signUpEnabled: boolean
      stripeEnabled: boolean
      analysisEnabled: boolean
      pdfExportEnabled: boolean
      savedDraftsEnabled: boolean
      accountDeletionEnabled: boolean
    }
  }
  recentActivity: Array<{
    id: string
    email: string
    name: string
    status: string
    source: string
    createdAt: string
    action: string
  }>
  growthChart: Array<{
    date: string
    users: number
  }>
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/nreadr/dashboard')
      
      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }
      
      const data = await response.json()
      setMetrics(data)
    } catch (err) {
      console.error('Error fetching metrics:', err)
      setError('Failed to load dashboard metrics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-neutral-900 font-semibold mb-2">Failed to Load Dashboard</p>
          <p className="text-neutral-600 mb-4">{error}</p>
          <button onClick={fetchMetrics} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
          <p className="text-neutral-600 mt-1">Overview of your platform metrics</p>
        </div>
        <button 
          onClick={fetchMetrics}
          className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Activity className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* ============================================ */}
      {/* A) USERS OVERVIEW */}
      {/* ============================================ */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4">Users Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={metrics.users.total.toLocaleString()}
            icon={Users}
            subtitle={`${metrics.users.active30d} active (30d)`}
            color="blue"
          />
          <StatCard
            title="Premium Users"
            value={metrics.users.premium.toLocaleString()}
            icon={CheckCircle}
            subtitle={
              metrics.users.premiumStripe > 0 || metrics.users.premiumManual > 0
                ? `${metrics.users.premiumStripe} paying, ${metrics.users.premiumManual} manual`
                : `${metrics.users.ratios.premium}% of total`
            }
            color="green"
          />
          <StatCard
            title="Trial Users"
            value={metrics.users.trial.toLocaleString()}
            icon={Clock}
            subtitle={`${metrics.users.ratios.trial}% of total`}
            color="yellow"
          />
          <StatCard
            title="Free Users"
            value={metrics.users.free.toLocaleString()}
            icon={Users}
            subtitle={`${metrics.users.ratios.free}% of total`}
            color="purple"
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* ANALYSES */}
      {/* ============================================ */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4">Analyses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Analyses"
            value={metrics.analyses.total.toLocaleString()}
            icon={FileText}
            subtitle={`${metrics.analyses.avgPerUser.toFixed(1)} per premium user`}
            color="blue"
          />
          <StatCard
            title="This Month"
            value={metrics.analyses.thisMonth.toLocaleString()}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="This Week"
            value={metrics.analyses.thisWeek.toLocaleString()}
            icon={Activity}
            color="teal"
          />
          <StatCard
            title="Active Users (7d)"
            value={metrics.users.active7d.toLocaleString()}
            icon={Activity}
            subtitle="Logged in this week"
            color="purple"
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* B) REVENUE & BILLING */}
      {/* ============================================ */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4">Revenue & Billing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="MRR"
            value={`$${metrics.revenue.mrr.toLocaleString()}`}
            icon={DollarSign}
            subtitle={
              metrics.revenue.stripePremiumCount > 0
                ? `${metrics.revenue.stripePremiumCount} paying customers`
                : metrics.revenue.manualPremiumCount > 0
                ? `${metrics.revenue.manualPremiumCount} manual (no revenue)`
                : 'No paying customers yet'
            }
            color="green"
          />
          <StatCard
            title="Expected This Week"
            value={`$${metrics.revenue.expectedWeekly.toFixed(2)}`}
            icon={TrendingUp}
            subtitle={
              metrics.revenue.stripePremiumCount > 0
                ? `${metrics.revenue.stripePremiumCount} × $7 ÷ 4.33`
                : 'No Stripe revenue yet'
            }
            color="green"
          />
          <StatCard
            title="Expected This Month"
            value={`$${metrics.revenue.expectedMonthly.toLocaleString()}`}
            icon={DollarSign}
            subtitle={
              metrics.revenue.stripePremiumCount > 0
                ? `${metrics.revenue.stripePremiumCount} Stripe users`
                : 'No Stripe revenue yet'
            }
            color="blue"
          />
          <StatCard
            title="Cancelled"
            value={metrics.revenue.cancelledThisMonth}
            icon={UserMinus}
            subtitle="This month"
            color="red"
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* C) GROWTH & CONVERSION */}
      {/* ============================================ */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4">Growth & Conversion</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="New Signups (Month)"
            value={metrics.growth.newSignupsMonth.toLocaleString()}
            icon={UserPlus}
            subtitle="Last 30 days"
            color="green"
          />
          <StatCard
            title="New Signups (Week)"
            value={metrics.growth.newSignupsWeek.toLocaleString()}
            icon={UserPlus}
            subtitle="Last 7 days"
            color="blue"
          />
          <StatCard
            title="Conversion Rate"
            value={`${metrics.growth.conversionRate.toFixed(1)}%`}
            icon={TrendingUp}
            subtitle="Trial → Premium"
            color="green"
          />
          <StatCard
            title="Churn Rate"
            value={`${metrics.growth.churnRate.toFixed(1)}%`}
            icon={UserMinus}
            subtitle="Cancellations / Premium"
            color={metrics.growth.churnRate > 5 ? 'red' : 'yellow'}
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* D) USER GROWTH CHART */}
      {/* ============================================ */}
      <section>
        <UserGrowthChart data={metrics.growthChart} />
      </section>

      {/* ============================================ */}
      {/* E) ALERTS & ACTION ITEMS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4">Alerts & Action Items</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AlertCard
            title="Trials Expiring Soon"
            count={metrics.alerts.trialsExpiring24h}
            description="Expiring in next 24 hours"
            type="warning"
            actionLink="/nreadr/users?filter=trials_expiring"
          />
          <AlertCard
            title="Trials This Week"
            count={metrics.alerts.trialsExpiring7d}
            description="Expiring in next 7 days"
            type="info"
            actionLink="/nreadr/users?filter=trials_expiring_week"
          />
          <AlertCard
            title="Pending Deletions"
            count={metrics.alerts.pendingDeletions}
            description="Accounts pending deletion"
            type={metrics.alerts.pendingDeletions > 0 ? 'error' : 'success'}
            actionLink="/nreadr/users?filter=pending_deletion"
          />
        </div>
      </section>

      {/* ============================================ */}
      {/* F) SYSTEM HEALTH */}
      {/* ============================================ */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4">System Health</h2>
        
        {/* Database Stats - FIXED for 1024px */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-neutral-200 mb-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-neutral-600 flex-shrink-0" />
            <h3 className="font-semibold text-neutral-900">Database Statistics</h3>
          </div>
          
          {/* Main stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-neutral-600 truncate">Users</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900 truncate">
                {metrics.system.database.totalUsers}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-neutral-600 truncate">Analyses</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900 truncate">
                {metrics.system.database.totalAnalyses}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-neutral-600 truncate">Groups</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900 truncate">
                {metrics.system.database.totalGroups}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-neutral-600 truncate">Banners</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900 truncate">
                {metrics.system.database.totalBanners}
              </p>
            </div>
            <div className="min-w-0 col-span-2 sm:col-span-1">
              <p className="text-xs sm:text-sm text-neutral-600 truncate">Est. Size</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-primary-600 truncate">
                {metrics.system.database.estimatedSize}
              </p>
            </div>
          </div>
          
          {/* Additional stats (only show if non-zero) */}
          {(metrics.system.database.totalProperties > 0 || 
            metrics.system.database.totalLegacyAnalyses > 0 || 
            metrics.system.database.totalAdminLogs > 0) && (
            <div className="pt-4 border-t border-neutral-200">
              <p className="text-xs text-neutral-500 mb-2">Additional Data:</p>
              <div className="grid grid-cols-3 gap-3">
                {metrics.system.database.totalProperties > 0 && (
                  <div>
                    <p className="text-xs text-neutral-600">Legacy Properties</p>
                    <p className="text-sm font-semibold text-neutral-900">
                      {metrics.system.database.totalProperties}
                    </p>
                  </div>
                )}
                {metrics.system.database.totalLegacyAnalyses > 0 && (
                  <div>
                    <p className="text-xs text-neutral-600">Legacy Analyses</p>
                    <p className="text-sm font-semibold text-neutral-900">
                      {metrics.system.database.totalLegacyAnalyses}
                    </p>
                  </div>
                )}
                {metrics.system.database.totalAdminLogs > 0 && (
                  <div>
                    <p className="text-xs text-neutral-600">Admin Logs</p>
                    <p className="text-sm font-semibold text-neutral-900">
                      {metrics.system.database.totalAdminLogs}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Feature Toggles */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-neutral-200">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-neutral-600" />
            <h3 className="font-semibold text-neutral-900">Feature Status</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(metrics.system.features).map(([key, value]) => {
              // Format feature names better
              const featureNames: Record<string, string> = {
                maintenanceMode: 'Maintenance Mode',
                dashboardEnabled: 'Dashboard',
                signUpEnabled: 'Sign Up',
                stripeEnabled: 'Stripe Payments',
                analysisEnabled: 'Property Analysis',
                pdfExportEnabled: 'PDF Export',
                savedDraftsEnabled: 'Saved Drafts',
                accountDeletionEnabled: 'Account Deletion'
              }
              
              return (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${value ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-neutral-700">
                    {featureNames[key] || key}
                  </span>
                  <span className="text-xs text-neutral-500 ml-auto">
                    {value ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* G) RECENT ACTIVITY */}
      {/* ============================================ */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div className="divide-y divide-neutral-200">
            {metrics.recentActivity.length === 0 ? (
              <div className="p-6 text-center text-neutral-500">
                No recent activity
              </div>
            ) : (
              metrics.recentActivity.map((activity) => (
                <div key={activity.id} className="p-3 sm:p-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.status === 'premium' ? 'bg-green-100' :
                        activity.status === 'trial' ? 'bg-yellow-100' :
                        'bg-neutral-100'
                      }`}>
                        <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          activity.status === 'premium' ? 'text-green-600' :
                          activity.status === 'trial' ? 'text-yellow-600' :
                          'text-neutral-600'
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-neutral-900 truncate text-sm sm:text-base">
                          {activity.name || activity.email}
                        </p>
                        <p className="text-xs sm:text-sm text-neutral-600">
                          {activity.action === 'signed_up' ? 'Signed up' : 'Active user'} • 
                          <span className="capitalize"> {activity.status}</span>
                          {activity.source && activity.source !== 'not set' && (
                            <span className="text-neutral-400"> ({activity.source})</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-neutral-500 whitespace-nowrap">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* QUICK ACTIONS */}
      {/* ============================================ */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <a href="/nreadr/users" className="btn-secondary flex items-center justify-center gap-2 py-3 text-sm sm:text-base">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Manage</span> Users
          </a>
          <a href="/nreadr/features" className="btn-secondary flex items-center justify-center gap-2 py-3 text-sm sm:text-base">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Feature</span> Toggles
          </a>
          <a href="/nreadr/banners" className="btn-secondary flex items-center justify-center gap-2 py-3 text-sm sm:text-base">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Manage</span> Banners
          </a>
          <a href="/dashboard" className="btn-secondary flex items-center justify-center gap-2 py-3 text-sm sm:text-base">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">View as</span> User
          </a>
        </div>
      </section>
    </div>
  )
}