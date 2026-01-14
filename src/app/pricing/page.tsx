// src/app/pricing/page.tsx
// FIX 1: Auto-redirect to dashboard after success
'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowLeft, Sparkles, Zap, Clock, Loader2, CheckCircle, X, AlertCircle } from 'lucide-react'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { StripeMaintenancePage } from '@/components/StripeMaintenancePage'

type SubscriptionStatus = 'trial' | 'free' | 'premium' | 'enterprise'

interface SubscriptionData {
  status: SubscriptionStatus
  trialEndsAt: string | null
  subscriptionEndsAt: string | null
  hasUsedTrial: boolean
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

  // Fetch subscription status if user is logged in
  useEffect(() => {
    if (isLoaded && user) {
      fetchSubscriptionStatus()
    }
  }, [isLoaded, user])

  // Check for checkout result messages
  useEffect(() => {
    const checkout = searchParams.get('checkout')
    if (checkout === 'success') {
      setShowSuccessMessage(true)
      // Remove the query param from URL
      window.history.replaceState({}, '', '/pricing')
      
      // FIX 1: Auto-redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } else if (checkout === 'canceled') {
      setShowCanceledMessage(true)
      // Remove the query param from URL
      window.history.replaceState({}, '', '/pricing')
    }
  }, [searchParams, router])

  // Auto-trigger checkout after sign up
  useEffect(() => {
    const startCheckout = searchParams.get('start_checkout')
    if (startCheckout === 'true' && user && !isProcessing) {
      // User just signed up and was redirected back
      // Auto-trigger the checkout
      handlePremiumCheckout()
      // Remove the query param
      window.history.replaceState({}, '', '/pricing')
    }
  }, [searchParams, user, isProcessing])

  const fetchSubscriptionStatus = async () => {
    setIsLoadingSubscription(true)
    try {
      const response = await fetch('/api/subscription/status')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionData(data)
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
      // FIX 2: New user - save intent and redirect to sign up with proper redirect_url
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

  // Show loading state while checking user AND system settings
  if (!isLoaded || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Check if Stripe is disabled - show maintenance page
  if (!settings.stripeEnabled) {
    return <StripeMaintenancePage />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="container mx-auto px-4 py-16">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="max-w-2xl mx-auto mb-8 bg-green-50 border border-green-200 rounded-lg p-6 flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Payment Successful! 🎉</h3>
              <p className="text-green-700 mb-3">
                Welcome to Premium! Your subscription is now active and you have access to all features.
              </p>
              <p className="text-sm text-green-600">Redirecting to dashboard...</p>
            </div>
          </div>
        )}

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

        {/* Back Button - Goes to home for new users, dashboard for logged in */}
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

          {/* Premium Plan - Highlighted */}
          <div className={`bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-2xl p-8 border-2 border-primary-500 relative ${
            !premiumButton.disabled && 'transform md:scale-105'
          }`}>
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-secondary-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Most Popular
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-white" />
              <h3 className="text-2xl font-bold text-white">
                Premium
              </h3>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">$7</span>
                <span className="text-primary-100">/month</span>
              </div>
              <p className="text-sm text-primary-100 mt-2">
                Unlimited access, cancel anytime
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Unlimited property analyses</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Save unlimited properties</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Professional PDF exports</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Create property groups</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Priority email support</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Early access to new features</span>
              </li>
            </ul>

            <button
              onClick={handlePremium}
              disabled={premiumButton.disabled || isProcessing}
              className="w-full py-4 px-6 bg-white text-primary-700 rounded-lg font-bold hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
              {premiumButton.label}
            </button>

            <p className="text-xs text-center text-primary-100 mt-4">
              {premiumButton.description}
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-neutral-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-neutral-900 mb-2">
                What's included in the free trial?
              </h3>
              <p className="text-neutral-600">
                The free trial gives you 72 hours to test our property analysis tools. You can run calculations and see cash flow projections, but you won't be able to save properties, export PDFs, or create property groups. Upgrade to Premium for unlimited access to all features.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-neutral-900 mb-2">
                What happens after my free trial?
              </h3>
              <p className="text-neutral-600">
                After 72 hours, your trial expires and you'll no longer be able to analyze properties. You can upgrade to Premium anytime to get unlimited access to all features including saving properties, PDF exports, and property groups.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-neutral-900 mb-2">
                Can I cancel my Premium subscription?
              </h3>
              <p className="text-neutral-600">
                Yes! You can cancel anytime from your account settings. You'll keep Premium access until the end of your billing period.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-neutral-900 mb-2">
                Do I need a credit card for the free trial?
              </h3>
              <p className="text-neutral-600">
                Nope! Start your free trial with just an email address. No payment required upfront.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-neutral-900 mb-2">
                Can I get another free trial?
              </h3>
              <p className="text-neutral-600">
                Free trials are one per user. Once your trial expires, you can upgrade to Premium for unlimited access to all features.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section - Only show if not already premium */}
        {(!user || (subscriptionData && subscriptionData.status !== 'premium' && subscriptionData.status !== 'enterprise')) && (
          <div className="mt-16 text-center">
            <p className="text-neutral-600 mb-4">
              Ready to analyze your first property?
            </p>
            <button
              onClick={user ? handlePremium : handleFreeTrial}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
              <Sparkles className="w-5 h-5" />
              {user ? 'Upgrade to Premium' : 'Start Free Trial Now'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}