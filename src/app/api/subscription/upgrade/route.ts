// src/app/api/subscription/upgrade/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/subscription/upgrade
 * Upgrades user to premium subscription
 * 
 * Body: { plan: 'premium' }
 * 
 * Demo mode: Instant upgrade without payment, sets billing date for testing
 * Future: Will integrate with Stripe checkout
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { plan } = body

    // Validate plan
    if (plan !== 'premium') {
      return NextResponse.json(
        { error: 'Invalid plan. Only "premium" is supported.' },
        { status: 400 }
      )
    }

    // Check if user is already premium
    if (user.subscriptionStatus === 'premium' || user.subscriptionStatus === 'enterprise') {
      return NextResponse.json(
        { 
          error: 'Already subscribed',
          message: 'You already have a premium subscription!',
          currentStatus: user.subscriptionStatus
        },
        { status: 400 }
      )
    }

    // =============================================================
    // DEMO MODE: Calculate next billing date for testing UI
    // =============================================================
    // In demo mode, we set subscriptionEndsAt so the UI can show:
    // - Next billing date
    // - Days remaining
    // - Billing period info
    // This lets you test the entire billing UI flow
    // =============================================================

    const subscriptionStartsAt = new Date()
    const subscriptionEndsAt = new Date()
    
    // Add 1 month (using JavaScript's built-in month handling)
    subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1)
    
    // Handle edge case: if day changed due to short month, use last day
    // Example: Jan 31 + 1 month = Feb 28/29 (not Mar 3)
    const originalDay = subscriptionStartsAt.getDate()
    if (subscriptionEndsAt.getDate() !== originalDay) {
      subscriptionEndsAt.setDate(0) // Set to last day of previous month
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'premium',
        subscriptionEndsAt: subscriptionEndsAt, // ✅ Set billing date for demo
        // Future Stripe fields:
        // stripeCustomerId: 'cus_xxx'
        // stripeSubscriptionId: 'sub_xxx'
      }
    })

    // Calculate days remaining for response
    const daysRemaining = Math.ceil(
      (subscriptionEndsAt.getTime() - subscriptionStartsAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    return NextResponse.json({
      success: true,
      message: 'Successfully upgraded to Premium!',
      demo: true,
      user: {
        id: updatedUser.id,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionEndsAt: updatedUser.subscriptionEndsAt,
      },
      billingInfo: {
        currentPeriodStart: subscriptionStartsAt,
        currentPeriodEnd: subscriptionEndsAt,
        daysInPeriod: daysRemaining,
        nextBillingDate: subscriptionEndsAt.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric', 
          year: 'numeric'
        })
      },
      note: 'Demo mode: Billing date set for UI testing. In production, Stripe will manage billing dates.'
    }, { status: 200 })

  } catch (error) {
    console.error('Upgrade error:', error)
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    )
  }
}

// =============================================================
// STRIPE INTEGRATION (Future Implementation)
// =============================================================
/*
When integrating Stripe, replace the demo billing calculation with:

const session = await stripe.checkout.sessions.create({
  customer: user.stripeCustomerId || await createStripeCustomer(user),
  line_items: [{ 
    price: process.env.STRIPE_PREMIUM_PRICE_ID, // Monthly price
    quantity: 1 
  }],
  mode: 'subscription',
  billing_cycle_anchor: 'now', // Start billing today
  success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/settings?upgrade=success`,
  cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
  metadata: {
    userId: user.id,
    clerkId: userId
  }
})

// Redirect to Stripe checkout
return NextResponse.json({ 
  checkoutUrl: session.url 
})

// Stripe webhook will then:
// 1. Listen for 'checkout.session.completed' event
// 2. Update user with:
//    - subscriptionStatus: 'premium'
//    - subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
//    - stripeCustomerId: customer.id
//    - stripeSubscriptionId: subscription.id
*/