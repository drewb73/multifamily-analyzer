// src/app/pricing/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowLeft, Sparkles, Zap, Clock, Loader2, CheckCircle, X, AlertCircle, Crown } from 'lucide-react'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { StripeMaintenancePage } from '@/components/StripeMaintenancePage'

type SubscriptionStatus = 'trial' | 'free' | 'premium' | 'enterprise'

interface SubscriptionData {
  status: SubscriptionStatus
  trialEndsAt: string | null
  subscriptionEndsAt: string | null
  hasUsedTrial: boolean
  cancelledAt: string | null
}

export default function PricingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings } = useSystemSettings()
  const [isProcessing, setIsProcessing] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showCanceledMessage, setShowCanceledMessage] = useState(false)
  const [showPremiumDetected, setShowPremiumDetected] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [webhookStatus, setWebhookStatus] = useState<string>('')

  // Fetch subscription status if user is logged in
  useEffect(() => {
    if (isLoaded && user) {
      fetchSubscriptionStatus()
    }
  }, [isLoaded, user])

  // Check for premium user detection (coming from sign-in)
  useEffect(() => {
    const fromSignIn = searchParams.get('from')
    if (fromSignIn === 'signin' && subscriptionData) {
      if (subscriptionData.status === 'premium' || subscriptionData.status === 'enterprise') {
        setShowPremiumDetected(true)
        // Auto-redirect after 3 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      }
    }
  }, [searchParams, subscriptionData, router])

  // FIX 2: Check for checkout success and show loading screen
  useEffect(() => {
    const checkout = searchParams.get('checkout')
    if (checkout === 'success') {
      setIsProcessingPayment(true)
      setWebhookStatus('Processing your payment...')
      
      // Poll for subscription status
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/subscription/status')
          if (response.ok) {
            const data = await response.json()
            if (data.subscription?.status === 'premium' || data.subscription?.status === 'enterprise') {
              setWebhookStatus('Payment successful! Redirecting...')
              clearInterval(pollInterval)
              
              // Wait 1 second then redirect
              setTimeout(() => {
                router.push('/dashboard')
              }, 1000)
            }
          }
        } catch (error) {
          console.error('Error polling subscription:', error)
        }
      }, 1000) // Poll every second
      
      // Cleanup and force redirect after 10 seconds
      setTimeout(() => {
        clearInterval(pollInterval)
        if (isProcessingPayment) {
          router.push('/dashboard')
        }
      }, 10000)
      
      return () => clearInterval(pollInterval)
    } else if (checkout === 'canceled') {
      setShowCanceledMessage(true)
      window.history.replaceState({}, '', '/pricing')
    }
  }, [searchParams, router])

  // FIX 1: Auto-trigger checkout after sign up - IMPROVED
  useEffect(() => {
    const startCheckout = searchParams.get('start_checkout')
    
    if (startCheckout === 'true' && user && isLoaded && !isProcessing) {
      // Remove the query param immediately
      window.history.replaceState({}, '', '/pricing')
      
      // Small delay to ensure user state is ready
      const timer = setTimeout(() => {
        handlePremiumCheckout()
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [searchParams, user, isLoaded, isProcessing])

  const fetchSubscriptionStatus = async () => {
    setIsLoadingSubscription(true)
    try {
      const response = await fetch('/api/subscription/status')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionData({
          status: data.subscription.status,
          trialEndsAt: data.subscription.trialEndsAt,
          subscriptionEndsAt: data.subscription.subscriptionEndsAt,
          hasUsedTrial: data.subscription.hasUsedTrial,
          cancelledAt: data.subscription.cancelledAt
        })
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error)
    } finally {
      setIsLoadingSubscription(false)
    }
  }

  // Calculate trial hours remaining
  const getTrialHoursRemaining = () => {
    if (!subscriptionData?.trialEndsAt) return 0
    const now = new Date()
    const trialEnd = new Date(subscriptionData.trialEndsAt)
    const diff = trialEnd.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    return Math.max(0, hours)
  }

  // Handle Free Trial Click
  const handleFreeTrial = () => {
    if (!user) {
      // New user - go to sign up (NO redirect_url for free trial)
      router.push('/sign-up')
      return
    }

    // User is logged in - check their status
    if (subscriptionData?.status === 'trial') {
      // Already on trial - go to dashboard
      router.push('/dashboard')
    } else if (subscriptionData?.status === 'premium' || subscriptionData?.status === 'enterprise') {
      // Already premium - go to dashboard
      router.push('/dashboard')
    } else if (subscriptionData?.hasUsedTrial) {
      // Already used trial - can't get another one
      alert('You have already used your free trial. Upgrade to Premium to continue.')
    } else {
      // Free user who hasn't used trial - shouldn't happen, but send to dashboard
      router.push('/dashboard')
    }
  }

  // Handle Premium Click - NOW WITH STRIPE!
  const handlePremium = async () => {
    if (!user) {
      // FIX 1: New user - save intent and redirect to sign up with proper redirect_url
      sessionStorage.setItem('intended_plan', 'premium')
      router.push('/sign-up?redirect_url=/pricing?start_checkout=true')
      return
    }

    // User is logged in - check their status
    if (subscriptionData?.status === 'premium' || subscriptionData?.status === 'enterprise') {
      // Already premium - go to dashboard
      router.push('/dashboard')
      return
    }

    // Not premium - start Stripe checkout
    await handlePremiumCheckout()
  }

  // NEW: Handle Stripe Checkout
  const handlePremiumCheckout = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      
      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error('Checkout error:', error)
      alert(error instanceof Error ? error.message : 'Failed to start checkout. Please try again.')
      setIsProcessing(false)
    }
  }

  // Determine button states and labels
  const getTrialButtonProps = () => {
    if (!user) {
      return {
        label: 'Start Free Trial',
        disabled: false,
        description: 'Try property analysis for 72 hours'
      }
    }

    if (isLoadingSubscription) {
      return {
        label: 'Loading...',
        disabled: true,
        description: 'Checking your status...'
      }
    }

    if (subscriptionData?.status === 'trial') {
      const hours = getTrialHoursRemaining()
      return {
        label: 'Trial Active',
        disabled: true,
        description: `${hours} hours remaining`
      }
    }

    if (subscriptionData?.status === 'premium' || subscriptionData?.status === 'enterprise') {
      return {
        label: 'You\'re Premium!',
        disabled: true,
        description: 'Already subscribed'
      }
    }

    if (subscriptionData?.hasUsedTrial) {
      return {
        label: 'Trial Used',
        disabled: true,
        description: 'Upgrade to Premium instead'
      }
    }

    return {
      label: 'Start Free Trial',
      disabled: false,
      description: 'Try property analysis for 72 hours'
    }
  }

  const getPremiumButtonProps = () => {
    if (!user) {
      return {
        label: 'Subscribe Now',
        disabled: false,
        description: 'Billed monthly, cancel anytime'
      }
    }

    if (isLoadingSubscription || isProcessing) {
      return {
        label: 'Loading...',
        disabled: true,
        description: 'Processing...'
      }
    }

    if (subscriptionData?.status === 'premium' || subscriptionData?.status === 'enterprise') {
      return {
        label: 'Already Premium!',
        disabled: true,
        description: 'You have full access'
      }
    }

    return {
      label: 'Upgrade to Premium',
      disabled: false,
      description: 'Billed monthly, cancel anytime'
    }
  }

  const trialButton = getTrialButtonProps()
  const premiumButton = getPremiumButtonProps()

  // Show loading screen during payment processing
  if (isProcessingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-success-600 animate-spin" />
            </div>
            
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Processing Your Payment
            </h2>
            
            <p className="text-neutral-600 mb-6">
              {webhookStatus || 'Please wait while we confirm your payment...'}
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
              <CheckCircle className="w-4 h-4 text-success-500" />
              <span>This usually takes just a few seconds</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check for Stripe disabled/maintenance mode
  if (settings && !settings.stripeEnabled) {
    return <StripeMaintenancePage />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Canceled Message */}
        {showCanceledMessage && (
          <div className="max-w-2xl mx-auto mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">Checkout Canceled</h3>
              <p className="text-yellow-700">
                No worries! You can subscribe anytime you're ready.
              </p>
            </div>
          </div>
        )}

        {/* Premium Detected Message */}
        {showPremiumDetected && (
          <div className="max-w-2xl mx-auto mb-8 bg-primary-50 border border-primary-200 rounded-lg p-6 flex items-start gap-4">
            <Crown className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-primary-900 mb-1">Premium User Detected! 👋</h3>
              <p className="text-primary-700">
                You already have a premium subscription.
              </p>
              <p className="text-sm text-primary-600 mt-1">Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mb-8">
          <Link 
            href={user ? "/dashboard" : "/"} 
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {user ? "Dashboard" : "Home"}
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Start with a free 72-hour trial. No credit card required.
            Upgrade to Premium anytime for just $7/month.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Free Trial Card */}
          <div className={`bg-white rounded-2xl shadow-lg p-8 border border-neutral-200 ${
            !trialButton.disabled && 'transform md:scale-105'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-6 h-6 text-neutral-600" />
              <h3 className="text-2xl font-bold text-neutral-900">
                Free Trial
              </h3>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-neutral-900">72 Hours</span>
              </div>
              <p className="text-sm text-neutral-600 mt-2">
                Try before you buy, no credit card
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <span className="text-neutral-700">Basic property analysis</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <span className="text-neutral-700">Cash flow calculations</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <span className="text-neutral-700">ROI metrics</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <span className="text-neutral-500">Save properties</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <span className="text-neutral-500">PDF export</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <span className="text-neutral-500">Create property groups</span>
              </li>
            </ul>

            <button
              onClick={handleFreeTrial}
              disabled={trialButton.disabled || isProcessing}
              className="w-full py-4 px-6 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {trialButton.label}
            </button>

            <p className="text-xs text-center text-neutral-500 mt-4">
              {trialButton.description}
            </p>
          </div>

          {/* Premium Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-primary-500 relative">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-primary-500 text-white text-sm font-semibold rounded-full flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                Most Popular
              </span>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-primary-600" />
              <h3 className="text-2xl font-bold text-neutral-900">
                Premium
              </h3>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-neutral-900">$7</span>
                <span className="text-neutral-600">/month</span>
              </div>
              <p className="text-sm text-neutral-600 mt-2">
                Billed monthly, cancel anytime
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                <span className="text-neutral-700">Unlimited property analysis</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                <span className="text-neutral-700">Advanced metrics & comparisons</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                <span className="text-neutral-700">Save unlimited properties</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                <span className="text-neutral-700">PDF export & reporting</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                <span className="text-neutral-700">Create property groups</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                <span className="text-neutral-700">Priority support</span>
              </li>
            </ul>

            <button
              onClick={handlePremium}
              disabled={premiumButton.disabled || isProcessing}
              className="w-full py-4 px-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  {premiumButton.label}
                </>
              )}
            </button>

            <p className="text-xs text-center text-neutral-500 mt-4">
              {premiumButton.description}
            </p>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-neutral-900 text-center mb-8">
            Compare Plans
          </h2>
          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-4 text-left text-neutral-900 font-semibold">Feature</th>
                  <th className="px-6 py-4 text-center text-neutral-900 font-semibold">Free Trial</th>
                  <th className="px-6 py-4 text-center text-neutral-900 font-semibold">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="px-6 py-4 text-neutral-700">Property Analysis</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-success-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-success-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-neutral-700">Save Properties</td>
                  <td className="px-6 py-4 text-center text-neutral-400">—</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-success-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-neutral-700">PDF Export</td>
                  <td className="px-6 py-4 text-center text-neutral-400">—</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-success-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-neutral-700">Property Groups</td>
                  <td className="px-6 py-4 text-center text-neutral-400">—</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-success-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-neutral-700">Priority Support</td>
                  <td className="px-6 py-4 text-center text-neutral-400">—</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-5 h-5 text-success-500 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}