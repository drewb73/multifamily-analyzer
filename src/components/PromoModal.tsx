'use client'

import { useEffect, useState } from 'react'
import { X, Copy, Check } from 'lucide-react'

interface PromoModalData {
  id: string
  title: string
  description: string
  discountCode: string | null
}

export function PromoModal() {
  const [modal, setModal] = useState<PromoModalData | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Check if user has already seen this modal
    const seenModals = localStorage.getItem('seenPromoModals')
    const seenIds = seenModals ? JSON.parse(seenModals) : []

    // Fetch active promo modal
    fetchPromoModal(seenIds)
  }, [])

  const fetchPromoModal = async (seenIds: string[]) => {
    try {
      const response = await fetch('/api/promo-modal/active')
      const data = await response.json()
      
      if (data.success && data.promoModal) {
        // Only show if user hasn't seen this modal yet
        if (!seenIds.includes(data.promoModal.id)) {
          setModal(data.promoModal)
          // Small delay before showing for smooth animation
          setTimeout(() => setIsVisible(true), 500)
        }
      }
    } catch (error) {
      console.error('Failed to fetch promo modal:', error)
    }
  }

  const closeModal = () => {
    setIsVisible(false)
    
    // Mark this modal as seen
    if (modal) {
      const seenModals = localStorage.getItem('seenPromoModals')
      const seenIds = seenModals ? JSON.parse(seenModals) : []
      seenIds.push(modal.id)
      localStorage.setItem('seenPromoModals', JSON.stringify(seenIds))
    }
    
    // Wait for animation to finish before removing from DOM
    setTimeout(() => setModal(null), 300)
  }

  const copyDiscountCode = () => {
    if (modal?.discountCode) {
      navigator.clipboard.writeText(modal.discountCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!modal) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-50 ${
          isVisible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={closeModal}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none`}
      >
        <div
          className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 pointer-events-auto transform transition-all duration-300 ${
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🎉</span>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              {modal.title}
            </h2>

            {/* Description */}
            <p className="text-neutral-600 mb-6 whitespace-pre-line">
              {modal.description}
            </p>

            {/* Discount Code */}
            {modal.discountCode && (
              <div className="bg-gradient-to-r from-primary-50 to-secondary-50 border-2 border-primary-200 rounded-lg p-4">
                <p className="text-xs font-medium text-neutral-600 mb-2">
                  YOUR DISCOUNT CODE
                </p>
                <div className="flex items-center justify-center gap-3">
                  <code className="text-2xl font-bold text-primary-600 tracking-wider">
                    {modal.discountCode}
                  </code>
                  <button
                    onClick={copyDiscountCode}
                    className="p-2 hover:bg-white/50 rounded transition-colors"
                    title="Copy code"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-success-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-primary-600" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Fine Print */}
            <p className="text-xs text-neutral-500 mt-6">
              Limited time offer. Terms and conditions apply.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}