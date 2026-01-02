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
  Building
} from 'lucide-react'
import { ManageUserModal } from '@/components/admin/ManageUserModal'

interface UserData {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  company: string | null
  isAdmin: boolean
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const usersPerPage = 10

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === '') {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = users.filter(user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase()
        const email = user.email.toLowerCase()
        const company = (user.company || '').toLowerCase()
        
        return fullName.includes(query) || 
               email.includes(query) || 
               company.includes(query)
      })
      setFilteredUsers(filtered)
      setCurrentPage(1) // Reset to first page when searching
    }
  }, [searchQuery, users])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/users')
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

  // Get subscription badge
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
        <div className="text-sm text-neutral-500">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {/* Users List */}
      {currentUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <User className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-600">
            {searchQuery ? 'No users found matching your search' : 'No users yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {currentUsers.map((user) => {
              const badge = getSubscriptionBadge(user.subscriptionStatus)
              const displayName = user.firstName || user.lastName 
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                : 'No name set'

              return (
                <div 
                  key={user.id} 
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-neutral-900">
                              {displayName}
                            </h3>
                            {user.isAdmin && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                                <Crown className="w-3 h-3 mr-1" />
                                Admin
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                          <div className="text-neutral-500 text-xs mb-1">Subscription</div>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                              {badge.text}
                            </span>
                            {user.subscriptionStatus === 'premium' && (
                              <span className="text-xs text-neutral-500">
                                {user.stripeSubscriptionId ? '💳' : '🎁'}
                              </span>
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

                        {user.subscriptionEndsAt && user.subscriptionStatus === 'premium' && (
                          <div>
                            <div className="text-neutral-500 text-xs mb-1">Renews</div>
                            <div className="flex items-center gap-1 text-success-600">
                              <Calendar className="w-3 h-3" />
                              {formatDate(user.subscriptionEndsAt)}
                            </div>
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