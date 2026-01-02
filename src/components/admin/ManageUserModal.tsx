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
  subscriptionStatus: string
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
          subscriptionStatus
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
                  <option value="trial">Trial</option>
                  <option value="premium">Premium</option>
                </select>
                <p className="text-xs text-neutral-500 mt-2">
                  Changing subscription status will immediately update the user's access level
                </p>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">Current Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Status</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                      {badge.text}
                    </span>
                  </div>

                  {user.trialEndsAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Trial Ends</span>
                      <span className="text-sm text-neutral-900">{formatDate(user.trialEndsAt)}</span>
                    </div>
                  )}

                  {user.subscriptionEndsAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Subscription Ends</span>
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
                    <h3 className="text-sm font-semibold text-error-900 mb-1">Danger Zone</h3>
                    <p className="text-xs text-error-700">
                      Deleting this account is permanent and cannot be undone. All user data, analyses, and settings will be permanently removed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">What will be deleted:</h3>
                <ul className="space-y-2 text-sm text-neutral-700">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full"></div>
                    User account and profile information
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full"></div>
                    All saved property analyses ({user._count.propertyAnalyses} total)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full"></div>
                    Subscription and billing information
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full"></div>
                    All account settings and preferences
                  </li>
                </ul>
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 px-4 bg-error-600 text-white rounded-lg font-medium hover:bg-error-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
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
                      This action requires your admin PIN for security
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
                      {isLoading ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}