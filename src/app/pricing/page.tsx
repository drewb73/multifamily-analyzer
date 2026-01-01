// src/app/pricing/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowLeft, Sparkles, Zap, Clock, Loader2, CheckCircle, X } from 'lucide-react'

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
  const [isProcessing, setIsProcessing] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false)

  // Fetch subscription status if user is logged in
  useEffect(() => {
    if (isLoaded && user) {
      fetchSubscriptionStatus()
    }
  }, [isLoaded, user])

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
      // New user - go to sign up
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

  // Handle Premium Click
  const handlePremium = () => {
    if (!user) {
      // New user - go to sign up, they'll get trial first
      router.push('/sign-up')
      return
    }

    // User is logged in - check their status
    if (subscriptionData?.status === 'premium' || subscriptionData?.status === 'enterprise') {
      // Already premium - go to dashboard
      router.push('/dashboard')
    } else {
      // Trial or free user - go to settings to upgrade
      router.push('/dashboard/settings')
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
        label: 'Get Premium Now',
        disabled: false,
        description: 'Billed monthly, cancel anytime'
      }
    }

    if (isLoadingSubscription) {
      return {
        label: 'Loading...',
        disabled: true,
        description: 'Checking your status...'
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

  // Show loading state while checking user
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="container mx-auto px-4 py-16">
        {/* Back Button - Goes to home for new users, dashboard for logged in */}
        <div className="mb-8">
          <Link 
            href={user ? "/dashboard" : "/"}
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{user ? "Back to Dashboard" : "Back to Home"}</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-display font-bold text-neutral-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Start analyzing multifamily properties today. No payment required upfront.
          </p>
          
          {/* Show user status if logged in */}
          {user && subscriptionData && (
            <div className="mt-6">
              {subscriptionData.status === 'trial' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">
                    Trial Active - {getTrialHoursRemaining()} hours remaining
                  </span>
                </div>
              )}
              {subscriptionData.status === 'premium' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-success-100 text-success-700 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">You're Premium! 🎉</span>
                </div>
              )}
              {subscriptionData.status === 'free' && subscriptionData.hasUsedTrial && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-full">
                  <span className="font-medium">Trial expired - Upgrade to Premium for unlimited access</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Free Trial Plan */}
          <div className={`bg-white rounded-2xl shadow-xl p-8 border-2 transition-all ${
            trialButton.disabled 
              ? 'border-neutral-200 opacity-75' 
              : 'border-neutral-200 hover:border-primary-300'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-6 h-6 text-primary-600" />
              <h3 className="text-2xl font-bold text-neutral-900">
                Free Trial
              </h3>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-neutral-900">$0</span>
                <span className="text-neutral-600">for 72 hours</span>
              </div>
              <p className="text-sm text-neutral-500 mt-2">
                No payment required upfront
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
              className="w-full py-4 px-6 bg-white text-primary-700 rounded-lg font-bold hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {premiumButton.label}
            </button>

            <p className="text-xs text-center text-primary-100 mt-4">
              {premiumButton.description}
            </p>
          </div>
        </div>

        {/* Trust Badges - Commented out for now */}
        {/* 
        <div className="mt-16 text-center">
          <p className="text-neutral-600 mb-6">Trusted by real estate investors</p>
          <div className="flex flex-wrap justify-center gap-8 text-neutral-400">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-success-600" />
              <span>No contracts</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-success-600" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-success-600" />
              <span>Secure payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-success-600" />
              <span>Money-back guarantee</span>
            </div>
          </div>
        </div>
        */}

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
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Sparkles className="w-5 h-5" />
              {user ? 'Upgrade to Premium' : 'Start Free Trial Now'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}