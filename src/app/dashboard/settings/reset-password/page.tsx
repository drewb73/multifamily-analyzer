// src/app/dashboard/settings/reset-password/page.tsx
// EMAIL VERIFICATION ONLY - NO CURRENT PASSWORD
'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Lock as LockIcon, AlertCircle, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'

export default function ChangePasswordPage() {
  const { user } = useUser()
  const router = useRouter()
  
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)

  const handleSendCode = async () => {
    if (!user?.primaryEmailAddress) {
      setError('No email address found')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      await user.primaryEmailAddress.prepareVerification({
        strategy: 'email_code'
      })
      
      setCodeSent(true)
    } catch (err: any) {
      console.error('Send code error:', err)
      setError(err.errors?.[0]?.message || 'Failed to send verification code.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.primaryEmailAddress) return
    
    setIsLoading(true)
    setError('')
    setSuccess(false)

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

    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code')
      setIsLoading(false)
      return
    }

    try {
      let isVerified = false
      
      try {
        const verification = await user.primaryEmailAddress.attemptVerification({
          code: verificationCode
        })
        
        if (verification.verification?.status === 'verified') {
          isVerified = true
        }
      } catch (verifyError: any) {
        if (verifyError.errors?.[0]?.code === 'verification_already_verified') {
          console.log('Email already verified')
          isVerified = true
        } else {
          throw verifyError
        }
      }
      
      if (!isVerified) {
        setError('Email verification failed. Please check your code.')
        setIsLoading(false)
        return
      }
      
      await user.updatePassword({
        newPassword: newPassword,
        signOutOfOtherSessions: true,
      })
      
      setSuccess(true)
      
      setTimeout(() => {
        router.push('/dashboard/settings')
      }, 2000)
    } catch (err: any) {
      console.error('Change password error:', err)
      
      if (err.errors?.[0]?.code === 'form_code_incorrect') {
        setError('Incorrect verification code. Please try again.')
      } else if (err.errors?.[0]?.code === 'form_password_pwned') {
        setError('This password has been found in a data breach. Please choose a different password.')
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
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Change Password
          </h1>
          <p className="text-neutral-600">
            Update your password with email verification
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Password Changed Successfully!
              </h3>
              <p className="text-neutral-600 mb-4">
                Your password has been updated. Redirecting to settings...
              </p>
              <Link href="/dashboard/settings" className="btn-primary inline-flex">
                Return to Settings
              </Link>
            </div>
          ) : !codeSent ? (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Email Verification Required</p>
                    <p>
                      For security, we'll send a verification code to your email to confirm you own the account.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email Address
                </label>
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary-600" />
                    <p className="text-sm font-medium text-primary-900">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  We'll send a 6-digit verification code to this address
                </p>
              </div>

              {error && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleSendCode}
                disabled={isLoading}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Send Verification Code
                  </>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-3 bg-success-50 border border-success-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                <p className="text-sm text-success-700">
                  ✉️ Check your email for the verification code
                </p>
              </div>

              {error && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  maxLength={6}
                  autoFocus
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-xl tracking-widest font-mono"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Enter the 6-digit code sent to {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>

              <div className="border-t border-neutral-200"></div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-12 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Must be at least 8 characters long
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-12 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCodeSent(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg text-neutral-700 font-medium hover:bg-neutral-50 transition-colors text-center disabled:opacity-50"
                >
                  Resend Code
                </button>
                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6 || newPassword.length < 8 || confirmPassword.length < 8}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Password Security Tips
          </h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Use a unique password for each account</li>
            <li>• Include a mix of letters, numbers, and symbols</li>
            <li>• Avoid using personal information</li>
            <li>• Consider using a password manager</li>
          </ul>
        </div>
      </div>
    </div>
  )
}