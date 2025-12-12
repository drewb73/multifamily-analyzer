// src/app/drafts/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { MainLayout, Button, Card } from '@/components'
import { getStorageItem, STORAGE_KEYS, formatTimeAgo } from '@/lib/utils' // Removed formatDate
import { DraftAnalysis } from '@/types'
import { Trash2, Edit, FileText, Clock } from 'lucide-react'
import Link from 'next/link'

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DraftAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDrafts()
  }, [])

  const loadDrafts = () => {
    const savedDrafts = getStorageItem<DraftAnalysis[]>(STORAGE_KEYS.DRAFTS, [])
    setDrafts(savedDrafts)
    setLoading(false)
  }

  const deleteDraft = (draftId: string) => {
    if (confirm('Are you sure you want to delete this draft?')) {
      const updatedDrafts = drafts.filter(d => d.id !== draftId)
      setDrafts(updatedDrafts)
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(updatedDrafts))
    }
  }

  const clearAllDrafts = () => {
    if (confirm('Are you sure you want to delete ALL drafts?')) {
      setDrafts([])
      localStorage.removeItem(STORAGE_KEYS.DRAFTS)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading drafts...</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-display font-bold text-neutral-900 mb-4">
            Your Drafts
          </h1>
          <p className="text-lg text-neutral-600">
            Continue where you left off or manage your saved analyses
          </p>
        </div>

        {drafts.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-800 mb-2">
              No drafts yet
            </h3>
            <p className="text-neutral-600 mb-6">
              Start a new analysis and it will be automatically saved here.
            </p>
            <Link href="/analyze">
              <Button className="px-8">Start New Analysis</Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-neutral-600">
                {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'} saved
              </div>
              <button
                onClick={clearAllDrafts}
                className="text-sm text-error-600 hover:text-error-800 font-medium"
              >
                Clear All
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drafts.map((draft) => (
                <Card key={draft.id} className="p-6 hover:shadow-medium transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">
                        {draft.name || 'Untitled Analysis'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(draft.lastModified)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/analyze?draft=${draft.id}`}>
                        <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => deleteDraft(draft.id)}
                        className="p-2 text-error-600 hover:bg-error-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Step:</span>
                      <span className="font-medium">
                        {draft.step === 4 ? 'Completed' : `Step ${draft.step}/4`}
                      </span>
                    </div>

                    {draft.data.property?.address && (
                      <div className="text-sm">
                        <div className="text-neutral-600">Address:</div>
                        <div className="font-medium truncate">
                          {draft.data.property.address}
                        </div>
                      </div>
                    )}

                    {/* Fix the purchasePrice check */}
                    {draft.data.property?.purchasePrice && draft.data.property.purchasePrice > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">Price:</span>
                        <span className="font-medium">
                          ${draft.data.property.purchasePrice.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-neutral-200">
                      <Link href={`/analyze?draft=${draft.id}`}>
                        <Button className="w-full">
                          {draft.step === 4 ? 'View Results' : 'Continue'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}