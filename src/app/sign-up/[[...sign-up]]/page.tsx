// FILE LOCATION: /src/app/sign-up/[[...sign-up]]/page.tsx
// Fixed: invitation error handling, token fallback for accept

'use client'

import { useState, useEffect } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, AlertCircle, Eye, EyeOff, Loader2, User, CheckCircle, Users } from 'lucide-react'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { AuthMaintenancePage } from '@/components/auth/AuthMaintenancePage'

interface InvitationData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  ownerName: string;
  ownerEmail: string;
  expiresAt: string;
}

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings: systemSettings, isLoading: settingsLoading } = useSystemSettings()
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')
  
  // Team invitation state
  const [invitationToken, setInvitationToken] = useState<string | null>(null)
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)
  const [loadingInvitation, setLoadingInvitation] = useState(false)
  // Separate invitation error from form errors so it doesn't block form
  const [invitationError, setInvitationError] = useState<string | null>(null)

  // Check for invitation token on mount
  useEffect(() => {
    const token = searchParams.get('invitation')
    if (token) {
      setInvitationToken(token)
      loadInvitationData(token)
    }
  }, [searchParams])

  const loadInvitationData = async (token: string) => {
    setLoadingInvitation(true)
    setInvitationError(null)
    try {
      const response = await fetch(`/api/team/invitations/validate?token=${token}`)
      const data = await response.json()

      if (response.ok && data.invitation) {
        setInvitationData(data.invitation)
        // Pre-populate form fields
        setEmail(data.invitation.email)
        setFirstName(data.invitation.firstName)
        setLastName(data.invitation.lastName)
      } else {
        // Show inline error on form but don't block it
        setInvitationError(data.error || 'Could not load invitation details.')
        console.error('Invitation load error:', data.error)
      }
    } catch (err) {
      console.error('Error loading invitation:', err)
      setInvitationError('Could not load invitation details. You can still sign up normally.')
    } finally {
      setLoadingInvitation(false)
    }
  }

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
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code })

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId })
        
        // Wait for Clerk webhook to create the user in database
        await new Promise(resolve => setTimeout(resolve, 2500))
        
        // If this was an invitation signup, accept the invitation
        // Use invitationData.id if available, fall back to looking up by token
        if (invitationToken) {
          try {
            let acceptUrl: string;

            if (invitationData?.id) {
              // Best case: we have the invitation ID directly
              acceptUrl = `/api/team/invitations/${invitationData.id}/accept`
            } else {
              // Fallback: accept by token (more resilient)
              acceptUrl = `/api/team/invitations/accept-by-token?token=${invitationToken}`
            }

            const acceptResponse = await fetch(acceptUrl, { method: 'POST' })
            const acceptData = await acceptResponse.json()

            if (acceptResponse.ok) {
              console.log('✅ Invitation accepted automatically:', acceptData.message)
              router.push('/dashboard')
              return
            } else {
              console.error('Failed to accept invitation:', acceptData.error)
              // Still redirect to dashboard - webhook may have set them up already
            }
          } catch (err) {
            console.error('Error accepting invitation:', err)
            // Still redirect - webhook handles the core setup
          }
        }
        
        // Check for redirect_url parameter
        const urlParams = new URLSearchParams(window.location.search)
        const redirectUrl = urlParams.get('redirect_url')
        if (redirectUrl) {
          router.push(decodeURIComponent(redirectUrl))
        } else {
          router.push('/dashboard')
        }
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
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to resend code.')
    } finally {
      setIsLoading(false)
    }
  }

  if (settingsLoading || loadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (systemSettings && !systemSettings.signUpEnabled) {
    return <AuthMaintenancePage feature="Sign Up" />
  }

  if (pendingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Check Your Email</h1>
            <p className="text-neutral-600">
              We've sent a verification code to<br />
              <span className="font-medium text-neutral-900">{email}</span>
            </p>
          </div>

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
        <div className="text-center mb-8">
          {invitationData ? (
            <>
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Join {invitationData.ownerName}'s Team
              </h1>
              <p className="text-neutral-600">
                You've been invited to join their workspace
              </p>
            </>
          ) : invitationToken ? (
            // Has token but invitation data failed to load - still show team UI
            <>
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Accept Team Invitation
              </h1>
              <p className="text-neutral-600">
                Create your account to join the workspace
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Create Your Account
              </h1>
              <p className="text-neutral-600">
                Start analyzing your multifamily investments
              </p>
            </>
          )}
        </div>

        {/* Team invitation info box */}
        {invitationData && (
          <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary-900">Team Workspace Invitation</p>
                <p className="text-sm text-primary-700 mt-1">
                  You'll join {invitationData.ownerName}'s workspace after creating your account
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Invitation warning (non-blocking) */}
        {invitationError && invitationToken && (
          <div className="mb-4 p-3 bg-warning-50 border border-warning-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning-700">{invitationError}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div id="clerk-captcha" className="hidden" />
            
            {error && (
              <div className="p-3 bg-error-50 border border-error-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                    disabled={!!invitationData}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                  disabled={!!invitationData}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={!!invitationData}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Password</label>
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
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-neutral-500 mt-1">Must be at least 8 characters long</p>
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
                invitationToken ? 'Create Account & Join Team' : 'Create Account'
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

        <div className="text-center mt-6 text-sm text-neutral-600">
          Professional multifamily property analysis made simple
        </div>
      </div>
    </div>
  )
}