'use client'

import { useState, useEffect } from 'react'
import { 
  Megaphone,
  Users,
  Crown,
  Shield,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles
} from 'lucide-react'

interface Banner {
  id: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  targetAudience: 'all' | 'free_trial' | 'premium' | 'admin'
  isActive: boolean
  startDate: string
  endDate: string | null
  durationDays: number | null
  createdBy: string
  createdAt: string
}

interface PromoModal {
  id: string
  title: string
  description: string
  discountCode: string | null
  isActive: boolean
  startDate: string
  endDate: string | null
  durationDays: number | null
  createdBy: string
  createdAt: string
}

const BANNER_TYPES = [
  { value: 'all', label: 'All Users', icon: Users, color: 'blue' },
  { value: 'free_trial', label: 'Free & Trial Users', icon: AlertCircle, color: 'yellow' },
  { value: 'premium', label: 'Premium Users', icon: Crown, color: 'purple' },
  { value: 'admin', label: 'Admins', icon: Shield, color: 'red' },
]

const MESSAGE_TYPES = [
  { value: 'info', label: 'Info', icon: Info, color: 'blue' },
  { value: 'success', label: 'Success', icon: CheckCircle, color: 'green' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'yellow' },
  { value: 'error', label: 'Error', icon: AlertCircle, color: 'red' },
]

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [promoModal, setPromoModal] = useState<PromoModal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // New banner form state
  const [newBanner, setNewBanner] = useState<{
    targetAudience: string
    message: string
    type: string
    durationDays: number
  }>({
    targetAudience: 'all',
    message: '',
    type: 'info',
    durationDays: 7,
  })

  // Promo modal form state
  const [promoForm, setPromoForm] = useState({
    title: '',
    description: '',
    discountCode: '',
    durationDays: 30,
    isActive: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [bannersRes, promoRes] = await Promise.all([
        fetch('/api/admin/banners'),
        fetch('/api/admin/promo-modal'),
      ])

      const bannersData = await bannersRes.json()
      const promoData = await promoRes.json()

      if (bannersData.success) {
        setBanners(bannersData.banners)
      }

      if (promoData.success && promoData.promoModal) {
        setPromoModal(promoData.promoModal)
        setPromoForm({
          title: promoData.promoModal.title,
          description: promoData.promoModal.description,
          discountCode: promoData.promoModal.discountCode || '',
          durationDays: promoData.promoModal.durationDays || 30,
          isActive: promoData.promoModal.isActive,
        })
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const createBanner = async () => {
    if (!newBanner.message.trim()) {
      setError('Message is required')
      setTimeout(() => setError(null), 3000)
      return
    }

    setError(null)

    try {
      const response = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBanner),
      })

      const data = await response.json()

      if (data.success) {
        setBanners([...banners, data.banner])
        setNewBanner({
          targetAudience: 'all',
          message: '',
          type: 'info',
          durationDays: 7,
        })
        setSuccess('Banner created successfully')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to create banner')
        setTimeout(() => setError(null), 3000)
      }
    } catch (err) {
      setError('Failed to create banner')
      setTimeout(() => setError(null), 3000)
    }
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setBanners(banners.filter(b => b.id !== id))
        setSuccess('Banner deleted')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to delete banner')
        setTimeout(() => setError(null), 3000)
      }
    } catch (err) {
      setError('Failed to delete banner')
      setTimeout(() => setError(null), 3000)
    }
  }

  const toggleBanner = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })

      const data = await response.json()

      if (data.success) {
        setBanners(banners.map(b => b.id === id ? { ...b, isActive } : b))
        setSuccess('Banner updated')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to update banner')
        setTimeout(() => setError(null), 3000)
      }
    } catch (err) {
      setError('Failed to update banner')
      setTimeout(() => setError(null), 3000)
    }
  }

  const savePromoModal = async () => {
    if (!promoForm.title.trim() || !promoForm.description.trim()) {
      setError('Title and description are required')
      setTimeout(() => setError(null), 3000)
      return
    }

    setError(null)

    try {
      const response = await fetch('/api/admin/promo-modal', {
        method: promoModal ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promoForm),
      })

      const data = await response.json()

      if (data.success) {
        setPromoModal(data.promoModal)
        setSuccess('Promo modal saved successfully')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to save promo modal')
        setTimeout(() => setError(null), 3000)
      }
    } catch (err) {
      setError('Failed to save promo modal')
      setTimeout(() => setError(null), 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  const getBannersByType = (type: string) => banners.filter(b => b.targetAudience === type)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900">Banner Management</h1>
        <p className="text-neutral-600 mt-1">
          Create and manage banners for different user groups
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg text-sm text-error-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-lg text-sm text-success-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Dashboard Banners */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Megaphone className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-neutral-900">Dashboard Banners</h2>
          </div>

          {/* Create New Banner */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-neutral-900 mb-4">Create New Banner</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Target Audience
                </label>
                <select
                  value={newBanner.targetAudience}
                  onChange={(e) => setNewBanner({ ...newBanner, targetAudience: e.target.value })}
                  className="input-field w-full"
                >
                  {BANNER_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Message Type
                </label>
                <select
                  value={newBanner.type}
                  onChange={(e) => setNewBanner({ ...newBanner, type: e.target.value })}
                  className="input-field w-full"
                >
                  {MESSAGE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Banner Message
              </label>
              <textarea
                value={newBanner.message}
                onChange={(e) => setNewBanner({ ...newBanner, message: e.target.value })}
                placeholder="Enter your banner message..."
                className="input-field w-full"
                rows={3}
              />
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Duration (Days)
              </label>
              <input
                type="number"
                value={newBanner.durationDays}
                onChange={(e) => setNewBanner({ ...newBanner, durationDays: parseInt(e.target.value) || 7 })}
                min="1"
                max="365"
                className="input-field w-32"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Banner will be active for {newBanner.durationDays} days
              </p>
            </div>

            <button
              onClick={createBanner}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Banner
            </button>
          </div>

          {/* Active Banners by Type */}
          {BANNER_TYPES.map(type => {
            const typeBanners = getBannersByType(type.value)
            const Icon = type.icon

            return (
              <div key={type.value} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 text-${type.color}-600`} />
                  <h3 className="font-semibold text-neutral-900">{type.label}</h3>
                  <span className="text-xs text-neutral-500">
                    ({typeBanners.length} {typeBanners.length === 1 ? 'banner' : 'banners'})
                  </span>
                </div>

                {typeBanners.length === 0 ? (
                  <p className="text-sm text-neutral-500 italic pl-7">
                    No active banners for this audience
                  </p>
                ) : (
                  <div className="space-y-2 pl-7">
                    {typeBanners.map(banner => {
                      const messageType = MESSAGE_TYPES.find(t => t.value === banner.type)
                      const MessageIcon = messageType?.icon || Info
                      
                      return (
                        <div
                          key={banner.id}
                          className="flex items-start justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-start gap-2">
                              <MessageIcon className={`w-4 h-4 mt-0.5 text-${messageType?.color}-600`} />
                              <p className="text-sm text-neutral-900">{banner.message}</p>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500 pl-6">
                              <span className="capitalize">{banner.type}</span>
                              <span>•</span>
                              <span>{banner.durationDays} days</span>
                              {banner.endDate && (
                                <>
                                  <span>•</span>
                                  <span>Expires: {new Date(banner.endDate).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => toggleBanner(banner.id, !banner.isActive)}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                banner.isActive
                                  ? 'bg-success-100 text-success-700'
                                  : 'bg-neutral-200 text-neutral-600'
                              }`}
                            >
                              {banner.isActive ? 'Active' : 'Inactive'}
                            </button>
                            <button
                              onClick={() => deleteBanner(banner.id)}
                              className="p-2 text-error-600 hover:bg-error-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Promo Modal */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-neutral-900">Landing Page Promo Modal</h2>
          </div>

          <div className="space-y-4">
            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
              <span className="text-sm font-medium text-neutral-700">Modal Active</span>
              <button
                onClick={() => setPromoForm({ ...promoForm, isActive: !promoForm.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  promoForm.isActive ? 'bg-primary-600' : 'bg-neutral-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    promoForm.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Modal Title
              </label>
              <input
                type="text"
                value={promoForm.title}
                onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                placeholder="Limited Time Offer!"
                className="input-field w-full"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description
              </label>
              <textarea
                value={promoForm.description}
                onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                placeholder="Get 50% off your first month with code WELCOME50"
                className="input-field w-full"
                rows={4}
              />
            </div>

            {/* Discount Code */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Discount Code (Optional)
              </label>
              <input
                type="text"
                value={promoForm.discountCode}
                onChange={(e) => setPromoForm({ ...promoForm, discountCode: e.target.value })}
                placeholder="WELCOME50"
                className="input-field w-full"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Duration (Days)
              </label>
              <input
                type="number"
                value={promoForm.durationDays}
                onChange={(e) => setPromoForm({ ...promoForm, durationDays: parseInt(e.target.value) || 30 })}
                min="1"
                max="365"
                className="input-field w-32"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Modal will be active for {promoForm.durationDays} days
              </p>
            </div>

            <button
              onClick={savePromoModal}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Promo Modal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}