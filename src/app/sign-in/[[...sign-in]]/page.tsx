// src/app/sign-in/[[...sign-in]]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSignIn, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, AlertCircle, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const { user, isLoaded: userLoaded } = useUser()
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  
  // Code + password entry state
  const [showCodeEntry, setShowCodeEntry] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  // ✅ FIX: Redirect if already logged in
  useEffect(() => {
    if (userLoaded && user) {
      // User is already signed in, redirect to dashboard
      router.push('/dashboard')
    }
  }, [userLoaded, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded) return
    
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        
        // ✅ FIX: Add delay for webhook to create DB user
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Sign in error:', err)
      
      if (err.errors?.[0]?.code === 'form_identifier_not_found') {
        setError('No account found with this email address.')
      } else if (err.errors?.[0]?.code === 'form_password_incorrect') {
        setError('Incorrect password. Please try again.')
      } else if (err.errors?.[0]?.code === 'session_exists') {
        // ✅ FIX: Handle session exists error
        setError('You are already signed in. Redirecting...')
        setTimeout(() => router.push('/dashboard'), 1000)
      } else if (err.errors?.[0]?.message) {
        setError(err.errors[0].message)
      } else {
        setError('Sign in failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded) return
    
    setIsLoading(true)
    setError('')

    try {
      const si = await signIn.create({
        identifier: resetEmail,
      })
      
      // This will send the reset email with verification code
      await si.prepareFirstFactor({
        strategy: 'reset_password_email_code',
        emailAddressId: si.supportedFirstFactors?.find(
          (factor) => factor.strategy === 'reset_password_email_code'
        )?.emailAddressId || '',
      })
      
      // Move to code entry screen
      setShowCodeEntry(true)
      setResetSent(false)
    } catch (err: any) {
      console.error('Reset password error:', err)
      
      // Handle email not found error
      if (err.errors?.[0]?.code === 'form_identifier_not_found') {
        setError('No account found with this email address. Please check and try again.')
        setResetEmail('') // Clear the form
      } else if (err.errors?.[0]?.message) {
        setError(err.errors[0].message)
      } else {
        setError('Failed to send verification code. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleResetWithCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded) return
    
    setIsLoading(true)
    setError('')

    try {
      // Reset password using the code
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: verificationCode,
        password: newPassword,
      })

      if (result.status === 'complete') {
        // Show success and auto sign-in
        setResetSuccess(true)
        
        // Sign in automatically
        await setActive({ session: result.createdSessionId })
        
        // ✅ FIX: Add delay for webhook
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }
    } catch (err: any) {
      console.error('Reset with code error:', err)
      
      if (err.errors?.[0]?.code === 'form_code_incorrect') {
        setError('Incorrect verification code. Please try again.')
      } else if (err.errors?.[0]?.code === 'form_password_pwned') {
        setError('This password has been found in a data breach. Please choose a different password.')
      } else if (err.errors?.[0]?.message) {
        setError(err.errors[0].message)
      } else {
        setError('Password reset failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ FIX: Show loading if checking user status
  if (!userLoaded || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Success screen after reset
  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8 text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Password Reset Successful!
            </h3>
            <p className="text-neutral-600 mb-4">
              Your password has been updated. Signing you in...
            </p>
            <Loader2 className="w-6 h-6 animate-spin text-primary-600 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  // Code + password entry screen
  if (showCodeEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Reset Your Password
            </h1>
            <p className="text-neutral-600">
              Enter the code sent to {resetEmail}
            </p>
          </div>

          {/* Code Entry Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8">
            <form onSubmit={handleResetWithCode} className="space-y-4">
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
                  Enter the 6-digit code from your email
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-12 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Must be at least 8 characters long
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || verificationCode.length !== 6 || newPassword.length < 8}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCodeEntry(false)
                  setVerificationCode('')
                  setNewPassword('')
                  setError('')
                }}
                className="w-full text-sm text-neutral-600 hover:text-neutral-900"
              >
                Back
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Email entry for reset
  if (showResetForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Reset Password
            </h1>
            <p className="text-neutral-600">
              Enter your email to receive a verification code
            </p>
          </div>

          {/* Reset Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8">
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowResetForm(false)
                  setError('')
                }}
                className="w-full text-sm text-neutral-600 hover:text-neutral-900"
              >
                Back to Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Main sign-in form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-neutral-600">
            Sign in to analyze your multifamily investments
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setShowResetForm(true)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-600">
            Don't have an account?{' '}
            <Link href="/sign-up" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-neutral-600">
          Professional multifamily property analysis made simple
        </div>
      </div>
    </div>
  )
}