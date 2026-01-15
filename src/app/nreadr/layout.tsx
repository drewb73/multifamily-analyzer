// COMPLETE FILE - MOBILE FRIENDLY ADMIN LAYOUT
// Location: src/app/admin/layout.tsx
// Action: REPLACE ENTIRE FILE
// ✅ Mobile hamburger menu
// ✅ Sidebar hidden on mobile, visible on desktop
// ✅ Clean and simple

'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, 
  Users, 
  Settings, 
  MessageSquare, 
  BarChart3,
  LogOut,
  Menu,
  X,
  Clock
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [needsPin, setNeedsPin] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    checkAdminStatus()
  }, [user, isLoaded])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const checkAdminStatus = async () => {
    if (!isLoaded) return

    // Check if user is signed in
    if (!user) {
      router.push('/sign-in')
      return
    }

    try {
      // Check if user is admin
      const response = await fetch('/api/nreadr/check-status')
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
      const response = await fetch('/api/nreadr/verify-pin', {
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
        <div className="bg-white border-b border-neutral-200 sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Left: Logo + Hamburger */}
              <div className="flex items-center gap-3">
                {/* Hamburger Button (Mobile Only) */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6 text-neutral-700" />
                  ) : (
                    <Menu className="w-6 h-6 text-neutral-700" />
                  )}
                </button>

                {/* Logo */}
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-primary-600" />
                  <h1 className="text-xl font-bold text-neutral-900">Admin Console</h1>
                </div>
              </div>

              {/* Right: User Info + Exit */}
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm text-neutral-600 truncate max-w-[120px] sm:max-w-none">
                  {user?.emailAddresses[0]?.emailAddress}
                </span>
                <Link 
                  href="/dashboard"
                  className="text-xs sm:text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-1 whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Exit Admin</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Slide-out Menu */}
        <div 
          className={`fixed top-16 left-0 bottom-0 w-64 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="p-4">
            <AdminNavLink href="/nreadr" icon={BarChart3} pathname={pathname}>
              Dashboard
            </AdminNavLink>
            <AdminNavLink href="/nreadr/users" icon={Users} pathname={pathname}>
              Users
            </AdminNavLink>
            <AdminNavLink href="/nreadr/features" icon={Settings} pathname={pathname}>
              Features
            </AdminNavLink>
            <AdminNavLink href="/nreadr/banners" icon={MessageSquare} pathname={pathname}>
              Banners
            </AdminNavLink>
            <AdminNavLink href="/nreadr/expirations" icon={Clock} pathname={pathname}>
              Expirations
            </AdminNavLink>
          </nav>
        </div>

        {/* Main Layout */}
        <div className="container mx-auto px-4 py-4 lg:py-8">
          <div className="flex gap-8">
            {/* Desktop Sidebar Navigation (Hidden on Mobile) */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <nav className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
                <AdminNavLink href="/nreadr" icon={BarChart3} pathname={pathname}>
                  Dashboard
                </AdminNavLink>
                <AdminNavLink href="/nreadr/users" icon={Users} pathname={pathname}>
                  Users
                </AdminNavLink>
                <AdminNavLink href="/nreadr/features" icon={Settings} pathname={pathname}>
                  Features
                </AdminNavLink>
                <AdminNavLink href="/nreadr/banners" icon={MessageSquare} pathname={pathname}>
                  Banners
                </AdminNavLink>
                <AdminNavLink href="/nreadr/expirations" icon={Clock} pathname={pathname}>
                  Expirations
                </AdminNavLink>
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
  pathname,
  children 
}: { 
  href: string
  icon: any
  pathname: string
  children: React.ReactNode 
}) {
  const isActive = pathname === href
  
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
        isActive 
          ? 'bg-primary-100 text-primary-700 font-semibold' 
          : 'text-neutral-700 hover:bg-primary-50 hover:text-primary-700'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{children}</span>
    </Link>
  )
}