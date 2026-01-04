'use client'

import { useEffect, useState } from 'react'
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react'

interface Banner {
  id: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  targetAudience: string
}

export function DashboardBanner() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([])

  useEffect(() => {
    // Load dismissed banners from localStorage
    const dismissed = localStorage.getItem('dismissedBanners')
    if (dismissed) {
      setDismissedBanners(JSON.parse(dismissed))
    }

    // Fetch active banners
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/banners/active')
      const data = await response.json()
      
      if (data.success) {
        setBanners(data.banners)
      }
    } catch (error) {
      console.error('Failed to fetch banners:', error)
    }
  }

  // ✅ THIS SHOULD ONLY UPDATE LOCALSTORAGE - NOT CALL API
  const dismissBanner = (bannerId: string) => {
    const newDismissed = [...dismissedBanners, bannerId]
    setDismissedBanners(newDismissed)
    localStorage.setItem('dismissedBanners', JSON.stringify(newDismissed))
    // ❌ NO API CALL HERE - Just localStorage!
  }

  const visibleBanners = banners.filter(b => !dismissedBanners.includes(b.id))

  if (visibleBanners.length === 0) {
    return null
  }

  const getBannerStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-success-50',
          border: 'border-success-200',
          text: 'text-success-800',
          icon: CheckCircle,
          iconColor: 'text-success-600'
        }
      case 'warning':
        return {
          bg: 'bg-warning-50',
          border: 'border-warning-200',
          text: 'text-warning-800',
          icon: AlertTriangle,
          iconColor: 'text-warning-600'
        }
      case 'error':
        return {
          bg: 'bg-error-50',
          border: 'border-error-200',
          text: 'text-error-800',
          icon: AlertCircle,
          iconColor: 'text-error-600'
        }
      default: // info
        return {
          bg: 'bg-primary-50',
          border: 'border-primary-200',
          text: 'text-primary-800',
          icon: Info,
          iconColor: 'text-primary-600'
        }
    }
  }

  return (
    <div className="space-y-3 mb-6">
      {visibleBanners.map(banner => {
        const styles = getBannerStyles(banner.type)
        const Icon = styles.icon

        return (
          <div
            key={banner.id}
            className={`${styles.bg} ${styles.border} border rounded-lg p-4 flex items-start gap-3`}
          >
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${styles.iconColor}`} />
            <p className={`flex-1 text-sm ${styles.text}`}>{banner.message}</p>
            <button
              onClick={() => dismissBanner(banner.id)}
              className={`flex-shrink-0 p-1 hover:bg-white/50 rounded ${styles.text}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}