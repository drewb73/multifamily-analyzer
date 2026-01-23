// src/app/dashboard/settings/reset-password/page.tsx
// HANDLES CLERK RE-VERIFICATION REQUIREMENT
'use client'

import { useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Lock as LockIcon, AlertCircle, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function ChangePasswordPage() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [needsReauth, setNeedsReauth] = useState(false)

  const handleReauth = async () => {
    await signOut()
    router.push('/sign-in?redirect_url=/dashboard/settings/reset-password')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    setIsLoading(true)
    setError('')
    setSuccess(false)
    setNeedsReauth(false)

    // Validation
    if (!currentPassword) {
      setError('Please enter your current password')
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setIsLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password')
      setIsLoading(false)
      return
    }

    try {
      await user.updatePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
        signOutOfOtherSessions: true,
      })
      
      setSuccess(true)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/settings')
      }, 2000)
    } catch (err: any) {
      console.error('Change password error:', err)
      
      // Check if re-authentication is needed
      if (err.message?.includes('additional verification') || 
          err.message?.includes('reverification') ||
          err.errors?.[0]?.code === 'reverification_required') {
        setNeedsReauth(true)
        setError('For security, you need to sign in again before changing your password. Your session may have been idle for too long.')
      } else if (err.errors?.[0]?.code === 'form_password_incorrect') {
        setError('Current password is incorrect')
      } else if (err.errors?.[0]?.code === 'form_password_pwned') {
        setError('This password has been found in a data breach. Please choose a different password.')
      } else if (err.errors?.[0]?.code === 'form_password_too_common') {
        setError('This password is too common. Please choose a more secure password.')
      } else if (err.errors?.[0]?.message) {
        setError(err.errors[0].message)
      } else {
        setError('Failed to change password. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Change Password
          </h1>
          <p className="text-neutral-600">
            Update your account password
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8">
          {success ? (
            // Success State
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Password Changed Successfully!
              </h3>
              <p className="text-neutral-600 mb-4">
                Your password has been updated. You've been signed out of other sessions for security.
              </p>
              <Link href="/dashboard/settings" className="btn-primary inline-flex">
                Return to Settings
              </Link>
            </div>
          ) : (
            // Password Change Form
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Info Banner */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Password Requirements</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>At least 8 characters long</li>
                      <li>Different from your current password</li>
                      <li>Not found in common password databases</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockIcon className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Enter current password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockIcon className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Enter new password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockIcon className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Confirm new password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Re-auth Required Message */}
              {needsReauth && (
                <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <RefreshCw className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-warning-700">
                      <p className="font-medium mb-1">Re-authentication Required</p>
                      <p>
                        For security, you need to sign in again before changing your password.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReauth}
                    className="w-full px-4 py-2 bg-warning-600 text-white rounded-lg hover:bg-warning-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sign In Again
                  </button>
                </div>
              )}

              {/* Error Message */}
              {error && !needsReauth && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Link
                  href="/dashboard/settings"
                  className="flex-1 px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-center font-medium"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading || needsReauth}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <LockIcon className="w-5 h-5" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Note */}
        <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-neutral-600">
              <p className="font-medium mb-1">Security Note</p>
              <p>
                Changing your password will sign you out of all other devices and sessions for security purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}