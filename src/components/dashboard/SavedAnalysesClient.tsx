// src/components/dashboard/SavedAnalysesClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components'
import { FileText, Trash2, Calendar } from 'lucide-react'
import { formatCurrency, formatTimeAgo, getStorageItem, STORAGE_KEYS } from '@/lib/utils'
import { DraftAnalysis } from '@/types'
import Link from 'next/link'

export function SavedAnalysesClient() {
  const [analyses, setAnalyses] = useState<DraftAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load analyses from localStorage
    const loadAnalyses = () => {
      try {
        const savedAnalyses = getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.DRAFTS, [])
        // Filter to only show completed analyses (those with results)
        const completedAnalyses = savedAnalyses.filter(analysis => analysis.results)
        setAnalyses(completedAnalyses)
      } catch (error) {
        console.error('Error loading analyses:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalyses()
  }, [])

  const handleDelete = (analysisId: string) => {
    if (confirm('Are you sure you want to delete this analysis?')) {
      try {
        const savedAnalyses = getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.DRAFTS, [])
        const updatedAnalyses = savedAnalyses.filter(a => a.id !== analysisId)
        localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(updatedAnalyses))
        
        // Update state
        setAnalyses(updatedAnalyses.filter(analysis => analysis.results))
      } catch (error) {
        console.error('Error deleting analysis:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="elevated-card p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-neutral-600">Loading your analyses...</p>
      </div>
    )
  }

  if (analyses.length === 0) {
    return (
      <div className="elevated-card p-12 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-semibold text-neutral-800 mb-3">
          No Saved Analyses Yet
        </h2>
        <p className="text-neutral-600 mb-6 max-w-md mx-auto">
          Complete a property analysis to save it here. All your completed analyses will appear in this list.
        </p>
        <Link href="/dashboard" className="btn-primary px-8 py-3 inline-block">
          Analyze a Property
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-neutral-600">
          {analyses.length} saved {analyses.length === 1 ? 'analysis' : 'analyses'}
        </p>
      </div>

      <div className="grid gap-4">
        {analyses.map((analysis) => {
          const property = analysis.data?.property
          const results = analysis.results
          
          // Skip if no property data
          if (!property) return null
          
          // Extract metrics safely - VALUES ARE STORED AS DECIMALS (0.0209 = 2.09%)
          const capRate = results?.keyMetrics?.capRate || 0
          const cashOnCashReturn = results?.keyMetrics?.cashOnCashReturn || 0
          const annualCashFlow = results?.keyMetrics?.annualCashFlow || 0
          
          return (
            <Card key={analysis.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                {/* Left side - Property info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-primary-600" />
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {analysis.name}
                    </h3>
                  </div>
                  
                  <div className="text-sm text-neutral-600 space-y-1 mb-4">
                    {property.address && (
                      <p>📍 {property.address}, {property.city}, {property.state} {property.zipCode}</p>
                    )}
                    <p>🏢 {property.totalUnits} units • {formatCurrency(property.purchasePrice || 0)}</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Saved {formatTimeAgo(analysis.lastModified)}</span>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  {results && results.keyMetrics && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="bg-primary-50 rounded-lg p-3">
                        <div className="text-xs text-primary-600 mb-1">Cap Rate</div>
                        <div className="text-lg font-bold text-primary-700">
                          {(capRate * 100).toFixed(2)}%
                        </div>
                      </div>
                      <div className="bg-success-50 rounded-lg p-3">
                        <div className="text-xs text-success-600 mb-1">Annual Cash Flow</div>
                        <div className="text-lg font-bold text-success-700">
                          {formatCurrency(annualCashFlow)}
                        </div>
                      </div>
                      <div className="bg-secondary-50 rounded-lg p-3">
                        <div className="text-xs text-secondary-600 mb-1">CoC Return</div>
                        <div className="text-lg font-bold text-secondary-700">
                          {(cashOnCashReturn * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side - Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <Link
                    href={`/dashboard?analysisId=${analysis.id}`}
                    className="btn-primary px-4 py-2 text-sm whitespace-nowrap"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleDelete(analysis.id)}
                    className="btn-secondary px-4 py-2 text-sm flex items-center gap-2 whitespace-nowrap text-error-600 hover:bg-error-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
