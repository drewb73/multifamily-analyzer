// FILE LOCATION: /src/app/dashboard/dealiq/page.tsx
// PURPOSE: Main DealIQ table view - Shows all deals

'use client'

import { useEffect, useState } from 'react'
import { Briefcase, Plus, Trash2, AlertTriangle, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { getStageLabel, getStageColors, getForecastLabel } from '@/lib/dealiq-constants'

interface Deal {
  id: string
  dealId: string
  address: string
  city: string | null
  state: string | null
  stage: string
  forecastStatus: string
  expectedCloseDate: Date | null
  createdAt: Date
  price: number
  units: number | null
}

export default function DealIQPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadDeals()
  }, [])

  const loadDeals = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/dealiq')
      const data = await response.json()

      if (data.success) {
        setDeals(data.deals)
      } else {
        setError('Failed to load deals')
      }
    } catch (err) {
      console.error('Load deals error:', err)
      setError('Failed to load deals')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (dealId: string) => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/dealiq/${dealId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Remove from local state
        setDeals(deals.filter(d => d.id !== dealId))
        setDeleteId(null)
      } else {
        alert('Failed to delete deal')
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete deal')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
          <p className="text-neutral-600">Loading deals...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-error-50 border border-error-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-error-600 mx-auto mb-4" />
        <p className="text-error-700">{error}</p>
        <button onClick={loadDeals} className="btn-primary mt-4">
          Try Again
        </button>
      </div>
    )
  }

  // Empty state
  if (deals.length === 0) {
    return (
      <div>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-neutral-900">DealIQ</h1>
          </div>
          <p className="text-neutral-600">
            Track your multifamily deals through the entire pipeline
          </p>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg border-2 border-dashed border-neutral-300 p-12 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            No Deals Yet
          </h2>
          <p className="text-neutral-600 mb-6 max-w-md mx-auto">
            Start by saving a property analysis and checking "Add to DealIQ" to create your first deal.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Analyze a Property
          </Link>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How to Add Deals</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Go to "Analyze Property" and complete an analysis</li>
            <li>Click "Save Analysis"</li>
            <li>Check the "Add to DealIQ" box</li>
            <li>Your deal will appear here!</li>
          </ol>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-neutral-900">DealIQ</h1>
          </div>
          <div className="text-sm text-neutral-600">
            {deals.length} {deals.length === 1 ? 'deal' : 'deals'}
          </div>
        </div>
        <p className="text-neutral-600">
          Track your multifamily deals through the entire pipeline
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Deal ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Stage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Forecast
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Close Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {deals.map((deal) => {
              const stageColors = getStageColors(deal.stage)
              return (
                <tr key={deal.id} className="hover:bg-neutral-50">
                  {/* Deal ID - Clickable */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/dashboard/dealiq/${deal.dealId}`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      #{deal.dealId}
                    </Link>
                  </td>

                  {/* Address */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-900">
                      {deal.address}
                    </div>
                    {(deal.city || deal.state) && (
                      <div className="text-sm text-neutral-500">
                        {deal.city}{deal.city && deal.state ? ', ' : ''}{deal.state}
                      </div>
                    )}
                  </td>

                  {/* Stage */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageColors.bg} ${stageColors.text}`}>
                      {getStageLabel(deal.stage)}
                    </span>
                  </td>

                  {/* Forecast */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {getForecastLabel(deal.forecastStatus)}
                  </td>

                  {/* Close Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {formatDate(deal.expectedCloseDate)}
                  </td>

                  {/* Created */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {formatDate(deal.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setDeleteId(deal.id)}
                      className="text-error-600 hover:text-error-900"
                      title="Delete deal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {deals.map((deal) => {
          const stageColors = getStageColors(deal.stage)
          return (
            <div key={deal.id} className="bg-white rounded-lg border border-neutral-200 p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link
                    href={`/dashboard/dealiq/${deal.dealId}`}
                    className="text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    #{deal.dealId}
                  </Link>
                  <div className="text-sm font-medium text-neutral-900 mt-1">
                    {deal.address}
                  </div>
                  {(deal.city || deal.state) && (
                    <div className="text-sm text-neutral-500">
                      {deal.city}{deal.city && deal.state ? ', ' : ''}{deal.state}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setDeleteId(deal.id)}
                  className="text-error-600 hover:text-error-900 p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Stage & Forecast */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageColors.bg} ${stageColors.text}`}>
                  {getStageLabel(deal.stage)}
                </span>
                <span className="text-xs text-neutral-600">
                  {getForecastLabel(deal.forecastStatus)}
                </span>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-neutral-500 text-xs mb-1">Close Date</div>
                  <div className="text-neutral-900 font-medium">
                    {formatDate(deal.expectedCloseDate)}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 text-xs mb-1">Created</div>
                  <div className="text-neutral-900 font-medium">
                    {formatDate(deal.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-error-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Delete Deal</h3>
                <p className="text-sm text-neutral-600">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-neutral-700 mb-6">
              Are you sure you want to delete this deal? All contacts, notes, and activity history will be permanently removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="flex-1 py-2 px-4 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={isDeleting}
                className="flex-1 py-2 px-4 bg-error-600 text-white rounded-lg font-medium hover:bg-error-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}