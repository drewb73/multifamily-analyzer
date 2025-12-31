// src/app/sign-up/[[...sign-up]]/page.tsx
'use client'

import { useState } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, AlertCircle, Eye, EyeOff, Loader2, User, CheckCircle } from 'lucide-react'

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded) return
    
    setIsLoading(true)
    setError('')

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      })

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      
      setPendingVerification(true)
    } catch (err: any) {
      console.error('Sign up error:', err)
      
      if (err.errors?.[0]?.code === 'form_identifier_exists') {
        setError('An account with this email already exists.')
      } else if (err.errors?.[0]?.code === 'form_password_pwned') {
        setError('This password has been found in a data breach. Please choose a different password.')
      } else if (err.errors?.[0]?.code === 'form_password_length_too_short') {
        setError('Password must be at least 8 characters long.')
      } else if (err.errors?.[0]?.message) {
        setError(err.errors[0].message)
      } else {
        setError('Sign up failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded) return
    
    setIsLoading(true)
    setError('')

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId })
        
        // ✅ FIX: Wait for webhook to create user in database
        // This prevents "Session already exists" and redirect loop issues
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Verification error:', err)
      
      if (err.errors?.[0]?.code === 'form_code_incorrect') {
        setError('Incorrect verification code. Please try again.')
      } else if (err.errors?.[0]?.message) {
        setError(err.errors[0].message)
      } else {
        setError('Verification failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const resendCode = async () => {
    if (!isLoaded) return
    
    setIsLoading(true)
    setError('')

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setError('') // Clear any previous errors
    } catch (err: any) {
      console.error('Resend error:', err)
      setError(err.errors?.[0]?.message || 'Failed to resend code.')
    } finally {
      setIsLoading(false)
    }
  }

  if (pendingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Check Your Email
            </h1>
            <p className="text-neutral-600">
              We've sent a verification code to<br />
              <span className="font-medium text-neutral-900">{email}</span>
            </p>
          </div>

          {/* Verification Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8">
            <form onSubmit={handleVerify} className="space-y-4">
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
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-2xl tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verify Email
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resendCode}
                disabled={isLoading}
                className="w-full text-sm text-neutral-600 hover:text-neutral-900"
              >
                Didn't receive the code? Resend
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Create Your Account
          </h1>
          <p className="text-neutral-600">
            Start analyzing your multifamily investments
          </p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ✅ FIX: Add clerk-captcha element to prevent warning */}
            <div id="clerk-captcha" className="hidden" />
            
            {error && (
              <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

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
              <p className="text-xs text-neutral-500 mt-1">
                Must be at least 8 characters long
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-600">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
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