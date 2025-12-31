// src/app/api/subscription/upgrade/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/subscription/upgrade
 * Upgrades user to premium subscription
 * 
 * DEMO MODE: Instant upgrade without payment
 * PRODUCTION MODE: Will redirect to Stripe checkout
 * 
 * Billing Period Logic:
 * - User subscribes on Dec 15th
 * - subscriptionEndsAt = Jan 15th (30 days later)
 * - If they cancel on Dec 20th, they keep premium until Jan 15th
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
    // DEMO MODE: Instant upgrade (no payment)
    // =============================================================
    // In production, this entire section will be replaced with:
    // 1. Create Stripe checkout session
    // 2. Redirect user to Stripe
    // 3. Webhook updates user on successful payment
    // =============================================================

    // Calculate billing period (30 days from now)
    const billingPeriodStart = new Date()
    const billingPeriodEnd = new Date()
    billingPeriodEnd.setDate(billingPeriodEnd.getDate() + 30)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'premium',
        subscriptionEndsAt: billingPeriodEnd, // User has premium until this date
        // Future Stripe fields:
        // stripeCustomerId: 'cus_xxx' (created in Stripe)
        // stripeSubscriptionId: 'sub_xxx' (created in Stripe)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully upgraded to Premium!',
      demo: true,
      user: {
        id: updatedUser.id,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionEndsAt: updatedUser.subscriptionEndsAt,
        billingPeriod: {
          start: billingPeriodStart,
          end: billingPeriodEnd,
          daysRemaining: 30
        }
      },
      note: 'Demo mode: In production, you would be redirected to Stripe for payment.'
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
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Create or retrieve Stripe customer
    let stripeCustomerId = user.stripeCustomerId
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          clerkId: userId,
          userId: user.id
        }
      })
      stripeCustomerId = customer.id
      
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId }
      })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: process.env.STRIPE_PREMIUM_PRICE_ID, // $7/month price
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/settings?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      metadata: {
        userId: user.id,
        clerkId: userId
      }
    })

    // Return checkout URL for redirect
    return NextResponse.json({
      checkoutUrl: session.url
    }, { status: 200 })

  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}

// Webhook handler will update user after successful payment:
// - subscriptionStatus = 'premium'
// - subscriptionEndsAt = subscription.current_period_end (from Stripe)
// - stripeSubscriptionId = subscription.id
*/