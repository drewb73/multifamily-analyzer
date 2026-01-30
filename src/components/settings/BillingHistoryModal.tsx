// src/components/settings/BillingHistoryModal.tsx
'use client'

import { X, CheckCircle, Clock, XCircle, Download, ExternalLink, Gift } from 'lucide-react'
import { useEffect } from 'react'

interface BillingHistoryItem {
  id: string
  date: Date
  amount: number
  status: 'paid' | 'pending' | 'failed'
  description: string
  invoiceUrl?: string | null  // ✅ NEW: Stripe-hosted invoice page
  pdfUrl?: string | null      // ✅ NEW: Direct PDF download
  isManual?: boolean          // ✅ NEW: Flag for manual/discount entries
}

interface BillingHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  billingHistory: BillingHistoryItem[]
}

export function BillingHistoryModal({ isOpen, onClose, billingHistory }: BillingHistoryModalProps) {
  
  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-success-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-warning-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-error-600" />
      default:
        return null
    }
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success-100 text-success-700'
      case 'pending':
        return 'bg-warning-100 text-warning-700'
      case 'failed':
        return 'bg-error-100 text-error-700'
      default:
        return 'bg-neutral-100 text-neutral-700'
    }
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900">
              Billing History
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {billingHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                  No billing history yet
                </h3>
                <p className="text-neutral-600">
                  Your payment history will appear here once you subscribe to Premium
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {billingHistory.map((item) => (
                  <div 
                    key={item.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      item.isManual 
                        ? 'border-primary-200 bg-primary-50/30' 
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {item.isManual ? (
                          <Gift className="w-5 h-5 text-primary-600" />
                        ) : (
                          getStatusIcon(item.status)
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-neutral-900">
                              {item.description}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(item.status)}`}>
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </span>
                          </div>
                          <div className="text-sm text-neutral-500">
                            {formatDate(item.date)}
                          </div>
                          {item.isManual && (
                            <div className="text-xs text-primary-600 mt-1 font-medium">
                              Complimentary Access
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`font-semibold ${item.amount === 0 ? 'text-primary-600' : 'text-neutral-900'}`}>
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                        {/* ✅ NEW: Download buttons for Stripe invoices */}
                        {item.status === 'paid' && !item.isManual && (
                          <div className="flex gap-1">
                            {item.invoiceUrl && (
                              <a
                                href={item.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                                title="View invoice"
                              >
                                <ExternalLink className="w-4 h-4 text-neutral-600" />
                              </a>
                            )}
                            {item.pdfUrl && (
                              <a
                                href={item.pdfUrl}
                                download
                                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                                title="Download receipt"
                              >
                                <Download className="w-4 h-4 text-neutral-600" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-neutral-200 p-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-neutral-100 text-neutral-700 font-medium rounded-lg hover:bg-neutral-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}