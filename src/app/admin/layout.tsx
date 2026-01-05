// COMPLETE FILE - REPLACE YOUR ENTIRE src/app/admin/layout.tsx WITH THIS
// Location: src/app/admin/layout.tsx
// Action: REPLACE ENTIRE FILE
// ✅ REMOVED: Discount Codes navigation link and Ticket icon

'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, 
  Users, 
  Settings, 
  MessageSquare, 
  BarChart3,
  LogOut
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [needsPin, setNeedsPin] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    checkAdminStatus()
  }, [user, isLoaded])

  const checkAdminStatus = async () => {
    if (!isLoaded) return

    // Check if user is signed in
    if (!user) {
      router.push('/sign-in')
      return
    }

    try {
      // Check if user is admin
      const response = await fetch('/api/admin/check-status')
      const data = await response.json()

      if (!data.isAdmin) {
        router.push('/dashboard')
        return
      }

      // Check if PIN is verified
      if (data.needsPin) {
        setNeedsPin(true)
        setIsVerifying(false)
      } else {
        setIsAdmin(true)
        setIsVerifying(false)
      }
    } catch (error) {
      console.error('Admin check failed:', error)
      router.push('/dashboard')
    }
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsVerifying(true)

    try {
      const response = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      })

      const data = await response.json()

      if (data.success) {
        setIsAdmin(true)
        setNeedsPin(false)
      } else {
        setError(data.error || 'Invalid PIN')
        setPin('')
      }
    } catch (error) {
      setError('Verification failed')
      setPin('')
    } finally {
      setIsVerifying(false)
    }
  }

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // PIN entry screen
  if (needsPin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center text-neutral-900 mb-2">
              Admin Access
            </h1>
            <p className="text-center text-neutral-600 mb-6">
              Enter your admin PIN to continue
            </p>

            <form onSubmit={handlePinSubmit}>
              <div className="mb-4">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter PIN"
                  className="input-field w-full text-center text-lg tracking-widest"
                  autoFocus
                  disabled={isVerifying}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg text-sm text-error-700 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!pin || isVerifying}
                className="btn-primary w-full py-3"
              >
                {isVerifying ? 'Verifying...' : 'Verify PIN'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-700">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Admin console layout
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Top Bar */}
        <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary-600" />
                <h1 className="text-xl font-bold text-neutral-900">Admin Console</h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-600">
                  {user?.emailAddresses[0]?.emailAddress}
                </span>
                <Link 
                  href="/dashboard"
                  className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  Exit Admin
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Sidebar Navigation */}
            <aside className="w-64 flex-shrink-0">
              <nav className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
                <AdminNavLink href="/admin" icon={BarChart3}>
                  Dashboard
                </AdminNavLink>
                <AdminNavLink href="/admin/users" icon={Users}>
                  Users
                </AdminNavLink>
                <AdminNavLink href="/admin/features" icon={Settings}>
                  Features
                </AdminNavLink>
                <AdminNavLink href="/admin/banners" icon={MessageSquare}>
                  Banners
                </AdminNavLink>
                {/* ✅ REMOVED: Discount Codes link - Use Stripe Dashboard instead */}
              </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function AdminNavLink({ 
  href, 
  icon: Icon, 
  children 
}: { 
  href: string
  icon: any
  children: React.ReactNode 
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors mb-1"
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{children}</span>
    </Link>
  )
}