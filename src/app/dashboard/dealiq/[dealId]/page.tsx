// FILE LOCATION: /src/app/dashboard/dealiq/[dealId]/page.tsx
// PURPOSE: Individual deal detail page with tabs for Account, Contacts, Notes, Activity
// UPDATED: Integrated AccountDetailsTab component

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Briefcase, 
  Building2, 
  Users, 
  FileText, 
  History,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { getStageLabel, getStageColors } from '@/lib/dealiq-constants'
import { AccountDetailsTab } from '@/components/dealiq/AccountDetailsTab'

interface Deal {
  id: string
  dealId: string
  address: string
  city: string | null
  state: string | null
  zipCode: string | null
  stage: string
  forecastStatus: string
  expectedCloseDate: Date | null
  price: number
  squareFeet: number | null
  units: number | null
  pricePerUnit: number | null
  pricePerSqft: number | null
  financingType: string | null
  createdAt: Date
  updatedAt: Date
  analysis: any
  contacts: any[]
  notes: any[]
  changes: any[]
}

type TabType = 'account' | 'contacts' | 'notes' | 'activity'

export default function DealDetailPage({ params }: { params: Promise<{ dealId: string }> }) {
  const router = useRouter()
  const [dealId, setDealId] = useState<string | null>(null)
  const [deal, setDeal] = useState<Deal | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('account')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Unwrap params
  useEffect(() => {
    params.then(p => setDealId(p.dealId))
  }, [params])

  // Load deal data
  useEffect(() => {
    if (!dealId) return

    const loadDeal = async () => {
      try {
        setIsLoading(true)
        console.log('📥 Loading deal:', dealId)
        
        const response = await fetch(`/api/dealiq/${dealId}`)
        const data = await response.json()

        if (data.success) {
          console.log('✅ Deal loaded:', data.deal)
          setDeal(data.deal)
        } else {
          setError('Deal not found')
        }
      } catch (err) {
        console.error('Load deal error:', err)
        setError('Failed to load deal')
      } finally {
        setIsLoading(false)
      }
    }

    loadDeal()
  }, [dealId])

  // Update deal
  const handleUpdateDeal = async (updates: Partial<Deal>) => {
    if (!deal) return

    try {
      console.log('🔄 Updating deal with:', updates)
      
      const response = await fetch(`/api/dealiq/${deal.dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Deal updated successfully')
        setDeal(data.deal)
      } else {
        throw new Error(data.error || 'Failed to update deal')
      }
    } catch (err) {
      console.error('Update deal error:', err)
      throw err
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading deal...</p>
        </div>
      </div>
    )
  }

  if (error || !deal) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-error-50 border border-error-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-error-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-error-900 mb-2">Deal Not Found</h2>
          <p className="text-error-700 mb-6">{error || 'This deal does not exist or you do not have access to it.'}</p>
          <Link
            href="/dashboard/dealiq"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Deals
          </Link>
        </div>
      </div>
    )
  }

  const stageColors = getStageColors(deal.stage)

  const tabs = [
    { id: 'account' as TabType, label: 'Account Details', icon: Building2 },
    { id: 'contacts' as TabType, label: 'Contacts', icon: Users },
    { id: 'notes' as TabType, label: 'Notes', icon: FileText },
    { id: 'activity' as TabType, label: 'Activity', icon: History },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        {/* Back button */}
        <Link
          href="/dashboard/dealiq"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deals
        </Link>

        {/* Deal Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">
                  Deal #{deal.dealId}
                </h1>
                <p className="text-lg text-neutral-600 mt-1">{deal.address}</p>
                {(deal.city || deal.state) && (
                  <p className="text-sm text-neutral-500">
                    {deal.city}{deal.city && deal.state ? ', ' : ''}{deal.state} {deal.zipCode}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
              <div className="text-xs text-neutral-500 mb-1">Price</div>
              <div className="text-lg font-bold text-neutral-900">{formatCurrency(deal.price)}</div>
            </div>
            {deal.units && (
              <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
                <div className="text-xs text-neutral-500 mb-1">Units</div>
                <div className="text-lg font-bold text-neutral-900">{deal.units}</div>
              </div>
            )}
            <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
              <div className="text-xs text-neutral-500 mb-1">Stage</div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageColors.bg} ${stageColors.text}`}>
                {getStageLabel(deal.stage)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 mb-6">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'account' && (
          <AccountDetailsTab deal={deal} onUpdate={handleUpdateDeal} />
        )}

        {activeTab === 'contacts' && (
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Contacts</h2>
            <p className="text-neutral-600">Contacts section coming next...</p>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Notes</h2>
            <p className="text-neutral-600">Notes section coming next...</p>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Activity Log</h2>
            <p className="text-neutral-600">Activity log coming next...</p>
          </div>
        )}
      </div>
    </div>
  )
}