'use client'

import { useEffect, useState } from 'react'
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  User,
  Crown,
  Clock,
  Calendar,
  Mail,
  Building,
  Trash2,
  AlertTriangle,
  CheckSquare,
  Square
} from 'lucide-react'
import { ManageUserModal } from '@/components/admin/ManageUserModal'

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
  cancelledAt: string | null // ✅ Added - Cancelled subscription date
  hasUsedTrial: boolean
  lastLoginAt: string | null
  createdAt: string
  _count: {
    propertyAnalyses: number
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  
  // Filter states
  const [filterSubscription, setFilterSubscription] = useState<string>('all')
  const [filterAccountStatus, setFilterAccountStatus] = useState<string>('all')
  const [filterAdmin, setFilterAdmin] = useState<string>('all')
  const [filterInactive, setFilterInactive] = useState<boolean>(false)
  
  // Sort states
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Bulk selection states
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [adminPin, setAdminPin] = useState('')
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [bulkDeleteError, setBulkDeleteError] = useState('')
  
  const usersPerPage = 10

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    // Filter and sort users
    let filtered = [...users]
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase()
        const email = user.email.toLowerCase()
        const company = (user.company || '').toLowerCase()
        
        return fullName.includes(query) || 
               email.includes(query) || 
               company.includes(query)
      })
    }
    
    // Apply subscription filter
    if (filterSubscription !== 'all') {
      filtered = filtered.filter(user => user.subscriptionStatus === filterSubscription)
    }
    
    // Apply account status filter
    if (filterAccountStatus !== 'all') {
      filtered = filtered.filter(user => user.accountStatus === filterAccountStatus)
    }
    
    // Apply admin filter
    if (filterAdmin === 'admin') {
      filtered = filtered.filter(user => user.isAdmin)
    } else if (filterAdmin === 'non-admin') {
      filtered = filtered.filter(user => !user.isAdmin)
    }
    
    // Apply inactive filter (60+ days since last login)
    if (filterInactive) {
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(user => {
        if (!user.lastLoginAt) return true // Never logged in = inactive
        return new Date(user.lastLoginAt) < sixtyDaysAgo
      })
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0
      
      switch (sortBy) {
        case 'createdAt':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'email':
          compareValue = a.email.localeCompare(b.email)
          break
        case 'name':
          const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim()
          const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim()
          compareValue = nameA.localeCompare(nameB)
          break
        case 'subscription':
          compareValue = a.subscriptionStatus.localeCompare(b.subscriptionStatus)
          break
        case 'subscriptionEndsAt':
          const dateA = a.subscriptionEndsAt ? new Date(a.subscriptionEndsAt).getTime() : 0
          const dateB = b.subscriptionEndsAt ? new Date(b.subscriptionEndsAt).getTime() : 0
          compareValue = dateA - dateB
          break
        case 'lastLoginAt':
          const loginA = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0
          const loginB = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0
          compareValue = loginA - loginB
          break
        case 'analyses':
          compareValue = a._count.propertyAnalyses - b._count.propertyAnalyses
          break
        default:
          compareValue = 0
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue
    })
    
    setFilteredUsers(filtered)
    setCurrentPage(1) // Reset to first page when filters/sort change
    setSelectedUserIds(new Set()) // Clear selection when filters change
  }, [searchQuery, users, filterSubscription, filterAccountStatus, filterAdmin, filterInactive, sortBy, sortOrder])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/nreadr/users')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users)
        setFilteredUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Bulk selection handlers
  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUserIds(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedUserIds.size === currentUsers.length) {
      setSelectedUserIds(new Set())
    } else {
      const allIds = currentUsers.map(u => u.id)
      setSelectedUserIds(new Set(allIds))
    }
  }

  const handleBulkMarkForDeletion = async () => {
    if (selectedUserIds.size === 0) return

    setBulkDeleteError('')
    setIsBulkDeleting(true)

    try {
      const response = await fetch('/api/nreadr/users/bulk-mark-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds: Array.from(selectedUserIds),
          adminPin
        })
      })

      const data = await response.json()

      if (data.success) {
        alert(`✅ Successfully marked ${data.marked} user${data.marked === 1 ? '' : 's'} for deletion!`)
        setShowBulkDeleteModal(false)
        setAdminPin('')
        setSelectedUserIds(new Set())
        await loadUsers()
      } else {
        if (data.code === 'PREMIUM_ACCOUNTS') {
          setBulkDeleteError(
            `Cannot mark premium accounts for deletion. Please downgrade these users first:\n\n${data.premiumUsers.map((u: any) => `• ${u.email} (${u.status})`).join('\n')}`
          )
        } else {
          setBulkDeleteError(data.error || 'Failed to mark users for deletion')
        }
      }
    } catch (error) {
      console.error('Bulk deletion error:', error)
      setBulkDeleteError('Network error. Please try again.')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  // Calculate days since last login
  const getDaysSinceLogin = (lastLoginAt: string | null): number | null => {
    if (!lastLoginAt) return null
    const daysSince = Math.floor((Date.now() - new Date(lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))
    return daysSince
  }

  // ✅ Updated: Get subscription badge - now accepts full user object
  const getSubscriptionBadge = (user: UserData) => {
    // ✅ Check if premium but cancelled
    if (user.subscriptionStatus === 'premium' && user.cancelledAt) {
      return { text: 'Premium - Cancelled', color: 'bg-warning-100 text-warning-700' }
    }
    
    switch (user.subscriptionStatus) {
      case 'premium':
        return { text: 'Premium', color: 'bg-success-100 text-success-700' }
      case 'trial':
        return { text: 'Trial', color: 'bg-warning-100 text-warning-700' }
      case 'free':
        return { text: 'Free', color: 'bg-neutral-100 text-neutral-700' }
      default:
        return { text: user.subscriptionStatus, color: 'bg-neutral-100 text-neutral-700' }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Users</h1>
          <p className="text-neutral-600 mt-1">
            Manage user accounts and subscriptions
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Bulk delete button */}
          {selectedUserIds.size > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Mark {selectedUserIds.size} for Deletion
            </button>
          )}
          <div className="text-sm text-neutral-500">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          </div>
        </div>
      </div>

      {/* Search, Filters, and Sort */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="input-field pl-10 w-full"
          />
        </div>

        {/* Filters and Sort */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Subscription Filter */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-2">
              Subscription
            </label>
            <select
              value={filterSubscription}
              onChange={(e) => setFilterSubscription(e.target.value)}
              className="input-field w-full text-sm"
            >
              <option value="all">All Subscriptions</option>
              <option value="free">Free</option>
              <option value="trial">Trial</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          {/* Account Status Filter */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-2">
              Account Status
            </label>
            <select
              value={filterAccountStatus}
              onChange={(e) => setFilterAccountStatus(e.target.value)}
              className="input-field w-full text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_deletion">Pending Deletion</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Admin Filter */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-2">
              Admin Access
            </label>
            <select
              value={filterAdmin}
              onChange={(e) => setFilterAdmin(e.target.value)}
              className="input-field w-full text-sm"
            >
              <option value="all">All Users</option>
              <option value="admin">Admins Only</option>
              <option value="non-admin">Non-Admins</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-2">
              Sort By
            </label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field flex-1 text-sm"
              >
                <option value="createdAt">Join Date</option>
                <option value="lastLoginAt">Last Login</option>
                <option value="email">Email</option>
                <option value="name">Name</option>
                <option value="subscription">Subscription</option>
                <option value="subscriptionEndsAt">Renewal/Expiry</option>
                <option value="analyses">Analysis Count</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Inactive 60+ days filter toggle */}
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterInactive}
              onChange={(e) => setFilterInactive(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-neutral-700">
              Show only inactive users (60+ days since last login)
            </span>
            {filterInactive && (
              <span className="text-xs text-warning-600 font-medium">
                ({filteredUsers.length} inactive)
              </span>
            )}
          </label>
        </div>

        {/* Active Filters Summary */}
        {(filterSubscription !== 'all' || filterAccountStatus !== 'all' || filterAdmin !== 'all' || filterInactive || searchQuery) && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-neutral-600">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-primary-900">×</button>
                </span>
              )}
              {filterSubscription !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                  {filterSubscription}
                  <button onClick={() => setFilterSubscription('all')} className="hover:text-primary-900">×</button>
                </span>
              )}
              {filterAccountStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                  {filterAccountStatus === 'pending_deletion' ? 'Pending Deletion' : filterAccountStatus}
                  <button onClick={() => setFilterAccountStatus('all')} className="hover:text-primary-900">×</button>
                </span>
              )}
              {filterAdmin !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                  {filterAdmin === 'admin' ? 'Admins' : 'Non-Admins'}
                  <button onClick={() => setFilterAdmin('all')} className="hover:text-primary-900">×</button>
                </span>
              )}
              {filterInactive && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                  Inactive 60+ days
                  <button onClick={() => setFilterInactive(false)} className="hover:text-primary-900">×</button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilterSubscription('all')
                  setFilterAccountStatus('all')
                  setFilterAdmin('all')
                  setFilterInactive(false)
                }}
                className="text-xs text-neutral-500 hover:text-neutral-700 underline ml-2"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users List */}
      {currentUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <User className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-600">
            {searchQuery || filterInactive ? 'No users found matching your filters' : 'No users yet'}
          </p>
        </div>
      ) : (
        <>
          {/* Select all checkbox */}
          {currentUsers.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-primary-600"
              >
                {selectedUserIds.size === currentUsers.length ? (
                  <CheckSquare className="w-5 h-5 text-primary-600" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                {selectedUserIds.size === currentUsers.length ? 'Deselect All' : 'Select All on This Page'}
              </button>
              {selectedUserIds.size > 0 && (
                <span className="text-sm text-neutral-500">
                  ({selectedUserIds.size} selected)
                </span>
              )}
            </div>
          )}

          <div className="space-y-4">
            {currentUsers.map((user) => {
              const badge = getSubscriptionBadge(user) // ✅ Now passes full user object
              const displayName = user.firstName || user.lastName 
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                : 'No name set'
              const daysSinceLogin = getDaysSinceLogin(user.lastLoginAt)
              const isSelected = selectedUserIds.has(user.id)

              return (
                <div 
                  key={user.id} 
                  className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
                    user.accountStatus === 'pending_deletion' ? 'border-2 border-error-300 bg-error-50' : ''
                  } ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleUserSelection(user.id)}
                      className="mt-1"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Square className="w-5 h-5 text-neutral-400 hover:text-primary-600" />
                      )}
                    </button>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold text-neutral-900">
                              {displayName}
                            </h3>
                            {user.isAdmin && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                                <Crown className="w-3 h-3 mr-1" />
                                Admin
                              </span>
                            )}
                            {user.accountStatus === 'pending_deletion' && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-error-100 text-error-700 rounded text-xs font-medium">
                                🗑️ Pending Deletion
                              </span>
                            )}
                            {/* Inactive badge */}
                            {daysSinceLogin !== null && daysSinceLogin >= 60 && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-warning-100 text-warning-700 rounded text-xs font-medium">
                                ⚠️ Inactive {daysSinceLogin} days
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-600 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* User Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-sm">
                        <div>
                          <div className="text-neutral-500 text-xs mb-1">Subscription</div>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                              {badge.text}
                            </span>
                            {user.subscriptionStatus === 'premium' && !user.cancelledAt && (
                              <span className="text-xs text-neutral-500">
                                {user.stripeSubscriptionId ? '💳' : '🎁'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Last Login */}
                        <div>
                          <div className="text-neutral-500 text-xs mb-1">Last Login</div>
                          <div className={`text-neutral-900 ${daysSinceLogin && daysSinceLogin >= 60 ? 'text-warning-600 font-medium' : ''}`}>
                            {user.lastLoginAt ? (
                              <>
                                {formatDate(user.lastLoginAt)}
                                {daysSinceLogin !== null && (
                                  <div className="text-xs text-neutral-500 mt-0.5">
                                    ({daysSinceLogin} days ago)
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-neutral-400">Never</span>
                            )}
                          </div>
                        </div>

                        {user.company && (
                          <div>
                            <div className="text-neutral-500 text-xs mb-1">Company</div>
                            <div className="flex items-center gap-1 text-neutral-900">
                              <Building className="w-3 h-3" />
                              <span className="truncate">{user.company}</span>
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="text-neutral-500 text-xs mb-1">Joined</div>
                          <div className="flex items-center gap-1 text-neutral-900">
                            <Calendar className="w-3 h-3" />
                            {formatDate(user.createdAt)}
                          </div>
                        </div>

                        <div>
                          <div className="text-neutral-500 text-xs mb-1">Analyses</div>
                          <div className="text-neutral-900 font-medium">
                            {user._count.propertyAnalyses}
                          </div>
                        </div>

                        {user.trialEndsAt && user.subscriptionStatus === 'trial' && (
                          <div>
                            <div className="text-neutral-500 text-xs mb-1">Trial Ends</div>
                            <div className="flex items-center gap-1 text-warning-600">
                              <Clock className="w-3 h-3" />
                              {formatDate(user.trialEndsAt)}
                            </div>
                          </div>
                        )}

                        {/* ✅ Updated: Show "Expires" if cancelled, "Renews" if active */}
                        {user.subscriptionEndsAt && user.subscriptionStatus === 'premium' && (
                          <div>
                            <div className="text-neutral-500 text-xs mb-1">
                              {user.cancelledAt ? 'Expires' : 'Renews'}
                            </div>
                            <div className={`flex items-center gap-1 ${user.cancelledAt ? 'text-warning-600' : 'text-success-600'}`}>
                              <Calendar className="w-3 h-3" />
                              {formatDate(user.subscriptionEndsAt)}
                            </div>
                            {/* ✅ Show "No future charge" when cancelled */}
                            {user.cancelledAt && (
                              <div className="text-xs text-neutral-500 mt-0.5">
                                (No future charge)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-4">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Manage →
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-neutral-200">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage = 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)

                  if (!showPage) {
                    // Show ellipsis
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2">...</span>
                    }
                    return null
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-primary-600 text-white'
                          : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-error-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900 mb-1">
                  Mark {selectedUserIds.size} Users for Deletion?
                </h3>
                <p className="text-sm text-neutral-600">
                  These accounts will be deleted permanently after 60 days. Users will lose access immediately.
                </p>
              </div>
            </div>

            {bulkDeleteError && (
              <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-sm text-error-700 whitespace-pre-wrap">{bulkDeleteError}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Enter Admin PIN to confirm
              </label>
              <input
                type="password"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Enter admin PIN"
                className="input-field w-full"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && adminPin) {
                    handleBulkMarkForDeletion()
                  }
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBulkDeleteModal(false)
                  setAdminPin('')
                  setBulkDeleteError('')
                }}
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                disabled={isBulkDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkMarkForDeletion}
                disabled={!adminPin || isBulkDeleting}
                className="flex-1 px-4 py-2 bg-error-600 text-white rounded-lg font-medium hover:bg-error-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkDeleting ? 'Marking...' : `Mark ${selectedUserIds.size} for Deletion`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage User Modal */}
      {selectedUser && (
        <ManageUserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={() => {
            loadUsers()
            setSelectedUser(null)
          }}
        />
      )}
    </div>
  )
}