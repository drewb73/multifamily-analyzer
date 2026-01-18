// FILE LOCATION: /src/app/dashboard/dealiq/[dealId]/page.tsx
// PURPOSE: Individual deal detail page with tabs for Account, Contacts, Notes, Activity
// UPDATED: Added ContactsTab integration

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
import { getStageLabel, getStageColors, DEAL_STAGES } from '@/lib/dealiq-constants'
import { AccountDetailsTab } from '@/components/dealiq/AccountDetailsTab'
import { ContactsTab } from '@/components/dealiq/ContactsTab'
import { NotesTab } from '@/components/dealiq/NotesTab'
import { ActivityLogTab } from '@/components/dealiq/ActivityLogTab'

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
  // New fields
  commissionPercent: number | null
  commissionAmount: number | null
  originalPurchasePrice: number | null
  netValue: number | null
  loanRate: number | null
  loanTerm: number | null
}

type TabType = 'account' | 'contacts' | 'notes' | 'activity'

export default function DealDetailPage({ params }: { params: Promise<{ dealId: string }> }) {
  const router = useRouter()
  const [dealId, setDealId] = useState<string | null>(null)
  const [deal, setDeal] = useState<Deal | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('account')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('')

  // Unwrap params
  useEffect(() => {
    params.then(p => setDealId(p.dealId))
  }, [params])

  // Get current user email
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const response = await fetch('/api/user/me')
        const data = await response.json()
        if (data.email) {
          setCurrentUserEmail(data.email)
        }
      } catch (error) {
        console.error('Failed to get user info:', error)
      }
    }
    getUserInfo()
  }, [])

  // Load deal data
  const loadDeal = async () => {
    if (!dealId) return

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

  useEffect(() => {
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
        console.log('✅ Deal updated')
        setDeal(data.deal)
      } else {
        alert('Failed to update deal')
      }
    } catch (err) {
      console.error('Update deal error:', err)
      alert('Failed to update deal')
    }
  }

  // Refetch deal data (for contacts, notes, etc.)
  const refetchDeal = async () => {
    await loadDeal()
  }

  const tabs = [
    { id: 'account' as TabType, label: 'Account Details', icon: Building2 },
    { id: 'contacts' as TabType, label: 'Contacts', icon: Users },
    { id: 'notes' as TabType, label: 'Notes', icon: FileText },
    { id: 'activity' as TabType, label: 'Activity Log', icon: History },
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-error-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Deal Not Found</h2>
          <p className="text-neutral-600 mb-4">{error || 'The deal you are looking for does not exist.'}</p>
          <Link
            href="/dashboard/dealiq"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to DealIQ
          </Link>
        </div>
      </div>
    )
  }

  const stageColors = getStageColors(deal.stage)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        href="/dashboard/dealiq"
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to DealIQ
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-6 h-6 text-primary-600" />
              <h1 className="text-3xl font-bold text-neutral-900">{deal.address}</h1>
            </div>
            {(deal.city || deal.state) && (
              <p className="text-base text-neutral-600 ml-9">
                {deal.city}{deal.city && deal.state ? ', ' : ''}{deal.state} {deal.zipCode}
              </p>
            )}
          </div>
        </div>

        {/* Stage Progress Bar */}
        <div className="mb-6">
          {/* Mobile Version - Simple Progress Bar */}
          <div className="md:hidden">
            {deal.stage === 'on_hold' ? (
              <div className="flex items-center justify-center py-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 border-2 border-neutral-400 rounded-full">
                  <span className="text-xl">⏸️</span>
                  <span className="text-sm font-semibold text-neutral-700">7 - On Hold</span>
                </div>
              </div>
            ) : (() => {
              const currentStage = DEAL_STAGES.find(s => s.id === deal.stage)
              const currentOrder = currentStage?.order || 0
              const maxOrder = 6
              const progressPercent = Math.min((currentOrder / maxOrder) * 100, 100)
              
              return (
                <div className="space-y-3">
                  {/* Stage Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">
                        {currentStage?.label || 'Unknown Stage'}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        Stage {currentOrder} of {maxOrder}
                      </div>
                    </div>
                    <div className={`
                      w-10 h-10 rounded-full border-3 flex items-center justify-center font-bold text-sm
                      bg-primary-600 border-primary-600 text-white shadow-md
                    `}>
                      {currentOrder}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-primary-600 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  
                  {/* Progress Text */}
                  <div className="text-xs text-neutral-500 text-center">
                    {progressPercent.toFixed(0)}% Complete
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Desktop Version - Circle Timeline */}
          <div className="hidden md:block">
            <div className="relative px-8">
              {/* Background Line */}
              <div className="absolute top-6 left-8 right-8 h-1 bg-neutral-200 rounded-full" />
              
              {/* Active Progress Line */}
              {deal.stage !== 'on_hold' && (() => {
                const currentStage = DEAL_STAGES.find(s => s.id === deal.stage)
                const currentOrder = currentStage?.order || 0
                const maxOrder = 6
                const progressPercent = Math.min((currentOrder / maxOrder) * 100, 100)
                
                return (
                  <div 
                    className="absolute top-6 left-8 h-1 bg-primary-600 rounded-full transition-all duration-500" 
                    style={{ width: `calc(${progressPercent}% + ${currentOrder * 0.5}rem)` }}
                  />
                )
              })()}

              {/* Stage Circles */}
              <div className="relative flex justify-between items-start">
                {DEAL_STAGES.filter(stage => stage.order <= 6).map((stage) => {
                  const currentStageOrder = DEAL_STAGES.find(s => s.id === deal.stage)?.order || 0
                  const isActive = stage.id === deal.stage || (
                    stage.order === 6 && (deal.stage === 'closed_won' || deal.stage === 'closed_lost')
                  )
                  const isCompleted = currentStageOrder > stage.order && deal.stage !== 'on_hold'

                  return (
                    <div key={stage.id} className="flex flex-col items-center" style={{ flex: 1 }}>
                      {/* Circle */}
                      <div className={`
                        relative w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-sm z-10 transition-all duration-300
                        ${isActive 
                          ? 'bg-primary-600 border-primary-600 text-white shadow-lg scale-110' 
                          : isCompleted
                          ? 'bg-success-500 border-success-500 text-white'
                          : 'bg-white border-neutral-300 text-neutral-400'
                        }
                      `}>
                        {stage.order}
                      </div>
                      
                      {/* Label */}
                      <div className={`
                        mt-2 text-center text-xs font-medium leading-tight transition-colors
                        ${isActive 
                          ? 'text-primary-700 font-semibold' 
                          : isCompleted 
                          ? 'text-success-700' 
                          : 'text-neutral-500'
                        }
                      `} style={{ maxWidth: '90px' }}>
                        {stage.label.replace(/^\d+\s*-\s*/, '')}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* On Hold Indicator */}
              {deal.stage === 'on_hold' && (
                <div className="mt-6 flex items-center justify-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 border-2 border-neutral-400 rounded-full">
                    <span className="text-xl">⏸️</span>
                    <span className="text-sm font-semibold text-neutral-700">7 - On Hold</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Deal ID */}
          <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
            <div className="text-xs text-neutral-500 mb-1">Deal ID</div>
            <div className="text-lg font-bold text-neutral-900">{deal.dealId}</div>
          </div>
          
          {/* Price */}
          <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
            <div className="text-xs text-neutral-500 mb-1">Price</div>
            <div className="text-lg font-bold text-neutral-900">{formatCurrency(deal.price)}</div>
          </div>
          
          {/* Units */}
          {deal.units && (
            <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
              <div className="text-xs text-neutral-500 mb-1">Units</div>
              <div className="text-lg font-bold text-neutral-900">{deal.units}</div>
            </div>
          )}
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
                {tab.id === 'contacts' && deal.contacts.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-full">
                    {deal.contacts.length}
                  </span>
                )}
                {tab.id === 'notes' && deal.notes.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-full">
                    {deal.notes.length}
                  </span>
                )}
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
          <ContactsTab 
            dealId={deal.dealId}
            contacts={deal.contacts}
            onUpdate={refetchDeal}
          />
        )}

        {activeTab === 'notes' && (
          <NotesTab 
            dealId={deal.dealId}
            notes={deal.notes}
            onUpdate={refetchDeal}
            currentUserEmail={currentUserEmail}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityLogTab 
            notes={deal.notes}
            changes={deal.changes}
            currentUserEmail={currentUserEmail}
          />
        )}
      </div>
    </div>
  )
}