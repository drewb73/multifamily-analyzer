// FILE LOCATION: /src/app/pricing/page.tsx
// FIX #2: Add loading screen with real-time webhook polling after payment

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
  subscription: {
    status: SubscriptionStatus
    trialEndsAt: string | null
    subscriptionEndsAt: string | null
    hasUsedTrial: boolean
    isPremium: boolean
  }
}

export default function PricingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings } = useSystemSettings()
  const [isProcessing, setIsProcessing] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false)
  const [showCanceledMessage, setShowCanceledMessage] = useState(false)
  
  // FIX #2: Loading screen state
  const [showLoadingScreen, setShowLoadingScreen] = useState(false)
  const [webhookStatus, setWebhookStatus] = useState('Processing your payment...')

  // Fetch subscription status if user is logged in
  useEffect(() => {
    if (isLoaded && user) {
      fetchSubscriptionStatus()
    }
  }, [isLoaded, user])

  // FIX #2: Check for payment success and show loading screen
  useEffect(() => {
    const checkout = searchParams.get('checkout')
    if (checkout === 'success' && user) {
      setShowLoadingScreen(true)
      window.history.replaceState({}, '', '/pricing')
      pollSubscriptionStatus()
    } else if (checkout === 'canceled') {
      setShowCanceledMessage(true)
      window.history.replaceState({}, '', '/pricing')
    }
  }, [searchParams, user])

  // FIX #2: Real-time webhook polling
  const pollSubscriptionStatus = async () => {
    let attempts = 0
    const maxAttempts = 30 // 30 seconds max
    
    const poll = async () => {
      try {
        const response = await fetch('/api/subscription/status')
        if (response.ok) {
          const data = await response.json()
          
          // Check if webhook has processed and user is now premium
          if (data.subscription?.status === 'premium') {
            setWebhookStatus('Payment successful! Redirecting...')
            await new Promise(resolve => setTimeout(resolve, 1500))
            router.push('/dashboard')
            return
          }
        }
        
        attempts++
        if (attempts < maxAttempts) {
          // Poll every 1 second
          setTimeout(poll, 1000)
        } else {
          // Timeout - redirect anyway but show message
          setWebhookStatus('Taking longer than expected...')
          await new Promise(resolve => setTimeout(resolve, 2000))
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Polling error:', error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000)
        }
      }
    }
    
    poll()
  }

  // Auto-trigger checkout after sign up
  useEffect(() => {
    const startCheckout = searchParams.get('start_checkout')
    if (startCheckout === 'true' && user && isLoaded && !isProcessing) {
      // Only trigger if subscription data is loaded
      if (subscriptionData) {
        const status = subscriptionData.subscription.status
        // Only trigger checkout if user is NOT already premium
        if (status !== 'premium' && status !== 'enterprise') {
          handlePremiumCheckout()
        }
        // Remove the query param
        window.history.replaceState({}, '', '/pricing')
      }
    }
  }, [searchParams, user, isLoaded, isProcessing, subscriptionData])

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
    if (!subscriptionData?.subscription?.trialEndsAt) return 0
    const now = new Date()
    const trialEnd = new Date(subscriptionData.subscription.trialEndsAt)
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
    const status = subscriptionData?.subscription?.status
    if (status === 'trial') {
      // Already on trial - go to dashboard
      router.push('/dashboard')
    } else if (status === 'premium' || status === 'enterprise') {
      // Already premium - go to dashboard
      router.push('/dashboard')
    } else if (subscriptionData?.subscription?.hasUsedTrial) {
      // Already used trial - can't get another one
      alert('You have already used your free trial. Upgrade to Premium to continue.')
    } else {
      // Free user who hasn't used trial - shouldn't happen, but send to dashboard
      router.push('/dashboard')
    }
  }

  // Handle Premium Click - Stripe checkout
  const handlePremium = async () => {
    if (!user) {
      // New user - redirect to sign up with proper redirect_url
      sessionStorage.setItem('intended_plan', 'premium')
      router.push('/sign-up?redirect_url=/pricing?start_checkout=true')
      return
    }

    // User is logged in - check their status
    const status = subscriptionData?.subscription?.status
    if (status === 'premium' || status === 'enterprise') {
      // Already premium - go to dashboard
      router.push('/dashboard')
      return
    }

    // Not premium - start Stripe checkout
    await handlePremiumCheckout()
  }

  // Handle Stripe Checkout
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
        description: 'No credit card required'
      }
    }

    const status = subscriptionData?.subscription?.status
    if (status === 'trial') {
      return {
        label: 'Already on Trial',
        disabled: true,
        description: 'Go to dashboard to analyze properties'
      }
    }
    if (status === 'premium' || status === 'enterprise') {
      return {
        label: 'Already Premium',
        disabled: true,
        description: 'You have full access'
      }
    }
    if (subscriptionData?.subscription?.hasUsedTrial) {
      return {
        label: 'Trial Already Used',
        disabled: true,
        description: 'Upgrade to Premium for full access'
      }
    }
    
    return {
      label: 'Start Free Trial',
      disabled: false,
      description: 'No credit card required'
    }
  }

  const getPremiumButtonProps = () => {
    if (!user) {
      return {
        label: 'Subscribe Now',
        disabled: false,
        description: 'Secure payment with Stripe'
      }
    }

    const status = subscriptionData?.subscription?.status
    if (status === 'premium' || status === 'enterprise') {
      return {
        label: 'Already Subscribed',
        disabled: true,
        description: 'You have full access'
      }
    }
    
    return {
      label: 'Subscribe Now',
      disabled: false,
      description: 'Secure payment with Stripe'
    }
  }

  const trialButton = getTrialButtonProps()
  const premiumButton = getPremiumButtonProps()

  // Check Stripe maintenance
  if (settings && !settings.stripeEnabled) {
    return <StripeMaintenancePage />
  }

  // FIX #2: Show loading screen during webhook processing
  if (showLoadingScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="relative">
            {/* Animated checkmark */}
            <div className="w-24 h-24 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle className="w-12 h-12 text-success-600" />
            </div>
            
            {/* Spinner */}
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          </div>
          
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Payment Successful! 🎉
          </h2>
          <p className="text-neutral-600 mb-4">
            {webhookStatus}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Canceled Message */}
        {showCanceledMessage && (
          <div className="mb-8 p-4 bg-warning-50 border border-warning-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning-900">Payment Canceled</p>
              <p className="text-sm text-warning-700 mt-1">
                You can try again anytime you're ready.
              </p>
              <button 
                onClick={() => setShowCanceledMessage(false)}
                className="text-sm text-warning-600 hover:text-warning-700 mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Start with a free trial or unlock everything with Premium
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Free Trial Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-neutral-200">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-6 h-6 text-neutral-700" />
              <h3 className="text-2xl font-bold text-neutral-900">
                72-Hour Free Trial
              </h3>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-neutral-900">$0</span>
                <span className="text-neutral-500">/72 hours</span>
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
        {(!user || (subscriptionData && subscriptionData.subscription.status !== 'premium' && subscriptionData.subscription.status !== 'enterprise')) && (
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