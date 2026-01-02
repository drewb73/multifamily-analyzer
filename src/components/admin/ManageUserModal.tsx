'use client'

import { useState } from 'react'
import { 
  X, 
  User, 
  Mail, 
  Building, 
  Crown, 
  Calendar,
  Clock,
  FileText,
  Trash2,
  Shield,
  Save,
  AlertTriangle
} from 'lucide-react'

interface UserData {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  company: string | null
  isAdmin: boolean
  accountStatus: string
  markedForDeletionAt: string | null
  subscriptionStatus: string
  stripeSubscriptionId: string | null
  trialEndsAt: string | null
  subscriptionEndsAt: string | null
  hasUsedTrial: boolean
  createdAt: string
  _count: {
    propertyAnalyses: number
  }
}

interface ManageUserModalProps {
  user: UserData
  onClose: () => void
  onUpdate: () => void
}

export function ManageUserModal({ user, onClose, onUpdate }: ManageUserModalProps) {
  const [tab, setTab] = useState<'info' | 'subscription' | 'admin' | 'delete'>('info')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form states
  const [firstName, setFirstName] = useState(user.firstName || '')
  const [lastName, setLastName] = useState(user.lastName || '')
  const [email, setEmail] = useState(user.email)
  const [company, setCompany] = useState(user.company || '')
  const [subscriptionStatus, setSubscriptionStatus] = useState(user.subscriptionStatus)
  const [premiumDuration, setPremiumDuration] = useState<number>(30) // days
  const [isAdmin, setIsAdmin] = useState(user.isAdmin)
  const [adminPin, setAdminPin] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAdminPinInput, setShowAdminPinInput] = useState(false)

  // Handle save user info
  const handleSaveInfo = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          company
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }

      setSuccess('User information updated successfully')
      setTimeout(() => {
        onUpdate()
        setSuccess(null)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle subscription update
  const handleUpdateSubscription = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/admin/users/${user.id}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionStatus,
          premiumDuration: subscriptionStatus === 'premium' ? premiumDuration : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription')
      }

      setSuccess('Subscription updated successfully')
      setTimeout(() => {
        onUpdate()
        setSuccess(null)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle admin status toggle
  const handleToggleAdmin = async () => {
    if (!showAdminPinInput) {
      // First click - show PIN input
      setShowAdminPinInput(true)
      return
    }

    if (!adminPin) {
      setError('Admin PIN is required to change admin access')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/admin/users/${user.id}/admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAdmin: !isAdmin,
          adminPin
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update admin status')
      }

      setIsAdmin(!isAdmin)
      setSuccess(`User ${!isAdmin ? 'granted' : 'revoked'} admin access`)
      setShowAdminPinInput(false)
      setAdminPin('')
      setTimeout(() => {
        onUpdate()
        setSuccess(null)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
      setAdminPin('')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!adminPin) {
      setError('Admin PIN is required to delete accounts')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPin })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      setSuccess('Account deleted successfully')
      setTimeout(() => {
        onUpdate()
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
      setAdminPin('')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case 'premium':
        return { text: 'Premium', color: 'bg-success-100 text-success-700' }
      case 'trial':
        return { text: 'Trial', color: 'bg-warning-100 text-warning-700' }
      case 'free':
        return { text: 'Free', color: 'bg-neutral-100 text-neutral-700' }
      default:
        return { text: status, color: 'bg-neutral-100 text-neutral-700' }
    }
  }

  const badge = getSubscriptionBadge(subscriptionStatus)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">
                {user.firstName || user.lastName 
                  ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                  : 'Unnamed User'}
              </h2>
              <p className="text-sm text-neutral-600">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200">
          <button
            onClick={() => setTab('info')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              tab === 'info'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            User Info
          </button>
          <button
            onClick={() => setTab('subscription')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              tab === 'subscription'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Subscription
          </button>
          <button
            onClick={() => setTab('admin')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              tab === 'admin'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Admin Access
          </button>
          <button
            onClick={() => setTab('delete')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              tab === 'delete'
                ? 'text-error-600 border-b-2 border-error-600'
                : 'text-neutral-600 hover:text-error-600'
            }`}
          >
            Delete
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg text-sm text-error-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-lg text-sm text-success-700">
              {success}
            </div>
          )}

          {/* User Info Tab */}
          {tab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input-field w-full"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input-field w-full"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="input-field w-full"
                  placeholder="Company name"
                />
              </div>

              {/* Read-only Info */}
              <div className="pt-4 border-t border-neutral-200">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">Account Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-neutral-500 mb-1">User ID</div>
                    <div className="text-neutral-900 font-mono text-xs">{user.id}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 mb-1">Joined</div>
                    <div className="text-neutral-900">{formatDate(user.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 mb-1">Total Analyses</div>
                    <div className="text-neutral-900 font-medium">{user._count.propertyAnalyses}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 mb-1">Trial Used</div>
                    <div className="text-neutral-900">{user.hasUsedTrial ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveInfo}
                disabled={isLoading}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Subscription Tab */}
          {tab === 'subscription' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Subscription Status
                </label>
                <select
                  value={subscriptionStatus}
                  onChange={(e) => setSubscriptionStatus(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="free">Free</option>
                  <option value="trial">Trial (72 hours)</option>
                  <option value="premium">Premium (Manual - No Charge)</option>
                </select>
              </div>

              {/* Premium Duration Options - Show when Premium is selected */}
              {subscriptionStatus === 'premium' && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">⏱️</span>
                    <label className="block text-base font-semibold text-blue-900">
                      Set Premium Duration
                    </label>
                  </div>
                  
                  <p className="text-sm text-blue-800 mb-4">
                    Choose how long this user will have premium access (FREE - no Stripe charge)
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => setPremiumDuration(7)}
                      className={`p-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                        premiumDuration === 7
                          ? 'border-blue-600 bg-blue-600 text-white shadow-lg scale-105'
                          : 'border-blue-200 bg-white text-blue-700 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setPremiumDuration(14)}
                      className={`p-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                        premiumDuration === 14
                          ? 'border-blue-600 bg-blue-600 text-white shadow-lg scale-105'
                          : 'border-blue-200 bg-white text-blue-700 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      14 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setPremiumDuration(30)}
                      className={`p-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                        premiumDuration === 30
                          ? 'border-blue-600 bg-blue-600 text-white shadow-lg scale-105'
                          : 'border-blue-200 bg-white text-blue-700 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      30 Days
                      <div className="text-xs opacity-75">Most Common</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPremiumDuration(90)}
                      className={`p-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                        premiumDuration === 90
                          ? 'border-blue-600 bg-blue-600 text-white shadow-lg scale-105'
                          : 'border-blue-200 bg-white text-blue-700 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      90 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setPremiumDuration(180)}
                      className={`p-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                        premiumDuration === 180
                          ? 'border-blue-600 bg-blue-600 text-white shadow-lg scale-105'
                          : 'border-blue-200 bg-white text-blue-700 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      6 Months
                    </button>
                    <button
                      type="button"
                      onClick={() => setPremiumDuration(365)}
                      className={`p-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                        premiumDuration === 365
                          ? 'border-blue-600 bg-blue-600 text-white shadow-lg scale-105'
                          : 'border-blue-200 bg-white text-blue-700 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      1 Year
                    </button>
                    <button
                      type="button"
                      onClick={() => setPremiumDuration(9999)}
                      className={`p-4 rounded-lg border-2 text-sm font-semibold transition-all col-span-2 ${
                        premiumDuration === 9999
                          ? 'border-amber-600 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg scale-105'
                          : 'border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 hover:border-amber-400'
                      }`}
                    >
                      <span className="text-lg">♾️</span> Lifetime Access
                    </button>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <label className="block text-xs font-medium text-blue-900 mb-2">
                      Or enter custom days:
                    </label>
                    <input
                      type="number"
                      value={premiumDuration === 9999 ? '' : premiumDuration}
                      onChange={(e) => setPremiumDuration(parseInt(e.target.value) || 30)}
                      placeholder="Enter number of days"
                      className="input-field w-full text-center"
                      min="1"
                      max="9998"
                    />
                  </div>

                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex gap-2 text-xs text-amber-800">
                      <span>⚠️</span>
                      <div>
                        <strong>Important:</strong> This will grant FREE premium access for{' '}
                        <strong>
                          {premiumDuration === 9999 
                            ? 'LIFETIME' 
                            : `${premiumDuration} day${premiumDuration !== 1 ? 's' : ''}`}
                        </strong>
                        . No Stripe charges will be made. Perfect for comps, partners, or testing.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">Current Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Status</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                      {badge.text}
                    </span>
                  </div>

                  {/* Show subscription source */}
                  {user.subscriptionStatus === 'premium' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Source</span>
                      <span className="text-sm text-neutral-900 font-medium">
                        {user.stripeSubscriptionId ? '💳 Stripe (Paid)' : '🎁 Manual (Free)'}
                      </span>
                    </div>
                  )}

                  {user.trialEndsAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Trial Ends</span>
                      <span className="text-sm text-neutral-900">{formatDate(user.trialEndsAt)}</span>
                    </div>
                  )}

                  {user.subscriptionEndsAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">
                        {user.stripeSubscriptionId ? 'Renews' : 'Expires'}
                      </span>
                      <span className="text-sm text-neutral-900">{formatDate(user.subscriptionEndsAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleUpdateSubscription}
                disabled={isLoading || subscriptionStatus === user.subscriptionStatus}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Updating...' : 'Update Subscription'}
              </button>
            </div>
          )}

          {/* Admin Access Tab */}
          {tab === 'admin' && (
            <div className="space-y-6">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-primary-900 mb-1">Admin Access</h3>
                    <p className="text-xs text-primary-700">
                      Admins have full access to the admin console and can manage all users, features, and settings.
                      They will use the same admin PIN to access the console.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Crown className={`w-5 h-5 ${isAdmin ? 'text-primary-600' : 'text-neutral-400'}`} />
                  <div>
                    <div className="text-sm font-medium text-neutral-900">Administrator</div>
                    <div className="text-xs text-neutral-600">
                      {isAdmin ? 'This user has admin access' : 'This user does not have admin access'}
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={() => {
                      if (!showAdminPinInput) {
                        setShowAdminPinInput(true)
                      }
                    }}
                    disabled={isLoading || showAdminPinInput}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {showAdminPinInput && (
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-warning-900 mb-1">Confirm Admin Access Change</h3>
                      <p className="text-xs text-warning-700">
                        {isAdmin 
                          ? 'Revoking admin access will immediately remove this user\'s ability to access the admin console.'
                          : 'Granting admin access will allow this user to manage all aspects of the application using your admin PIN.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Enter Admin PIN to Confirm
                      </label>
                      <input
                        type="password"
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        className="input-field w-full"
                        placeholder="Admin PIN"
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowAdminPinInput(false)
                          setAdminPin('')
                          setError(null)
                        }}
                        className="flex-1 py-2 px-4 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleToggleAdmin}
                        disabled={isLoading || !adminPin}
                        className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Updating...' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delete Tab */}
          {tab === 'delete' && (
            <div className="space-y-6">
              <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-error-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-error-900 mb-1">Account Deletion</h3>
                    <p className="text-xs text-error-700">
                      Marking an account for deletion will immediately revoke access, but data will be kept for 60 days. 
                      You can restore the account during this period.
                    </p>
                  </div>
                </div>
              </div>

              {/* Show restore option if account is pending deletion */}
              {user.accountStatus === 'pending_deletion' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-blue-900 mb-1">
                        Account Pending Deletion
                      </h3>
                      <p className="text-xs text-blue-700">
                        Marked for deletion on {user.markedForDeletionAt ? formatDate(user.markedForDeletionAt) : 'Unknown'}
                        <br />
                        Will be permanently deleted after 60 days unless restored.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      setIsLoading(true)
                      setError(null)
                      try {
                        const response = await fetch(`/api/admin/users/${user.id}/restore`, {
                          method: 'POST'
                        })
                        const data = await response.json()
                        if (!response.ok) throw new Error(data.error)
                        setSuccess('Account restored successfully!')
                        setTimeout(() => {
                          onUpdate()
                          setSuccess(null)
                        }, 2000)
                      } catch (err: any) {
                        setError(err.message)
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    🔄 Restore Account Access
                  </button>
                </div>
              )}

              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                  {user.accountStatus === 'pending_deletion' ? 'What happens if permanently deleted:' : 'What will happen:'}
                </h3>
                <ul className="space-y-2 text-sm text-neutral-700">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 flex items-center justify-center text-lg">🔒</div>
                    <span><strong>Immediate:</strong> User loses all access to their account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 flex items-center justify-center text-lg">📅</div>
                    <span><strong>60 Days:</strong> Data is retained (can be restored by admin)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 flex items-center justify-center text-lg">🗑️</div>
                    <span><strong>After 60 Days:</strong> Account and all data permanently deleted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 flex items-center justify-center text-lg">📊</div>
                    <span>All {user._count.propertyAnalyses} property analyses will be deleted</span>
                  </li>
                </ul>
              </div>

              {user.accountStatus !== 'pending_deletion' ? (
                !showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-3 px-4 bg-error-600 text-white rounded-lg font-medium hover:bg-error-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Mark Account for Deletion
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Enter Admin PIN to Confirm
                      </label>
                      <input
                        type="password"
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        className="input-field w-full"
                        placeholder="Admin PIN"
                        autoFocus
                      />
                      <p className="text-xs text-neutral-500 mt-2">
                        This will mark the account for deletion (60-day retention period)
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false)
                          setAdminPin('')
                          setError(null)
                        }}
                        className="flex-1 py-3 px-4 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isLoading || !adminPin}
                        className="flex-1 py-3 px-4 bg-error-600 text-white rounded-lg font-medium hover:bg-error-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {isLoading ? 'Processing...' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="bg-neutral-100 border border-neutral-300 rounded-lg p-4 text-center text-sm text-neutral-600">
                  Account is already marked for deletion. Use the restore button above to reactivate access.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}