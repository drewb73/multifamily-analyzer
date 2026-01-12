// src/app/api/subscription/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/subscription/cancel
 * Cancels user's premium subscription
 * 
 * IMPORTANT BILLING LOGIC:
 * - User keeps premium access until end of current billing period
 * - If user subscribed Dec 1st and cancels Dec 3rd
 * - They keep premium until Jan 1st (end of billing period)
 * - This is standard practice and what users expect
 * 
 * DEMO MODE: Immediate cancellation (for testing)
 * PRODUCTION MODE: Premium until subscriptionEndsAt
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

    // Check if user has premium to cancel
    if (user.subscriptionStatus !== 'premium' && user.subscriptionStatus !== 'enterprise') {
      return NextResponse.json(
        { 
          error: 'No active subscription',
          message: 'You do not have an active premium subscription to cancel.',
          currentStatus: user.subscriptionStatus
        },
        { status: 400 }
      )
    }

    // =============================================================
    // DEMO MODE: Immediate cancellation
    // =============================================================
    // In demo mode, we immediately downgrade to free
    // In production, user keeps premium until subscriptionEndsAt
    // =============================================================

    const now = new Date()
    const billingPeriodEnd = user.subscriptionEndsAt || now // For production note only

    // DEMO MODE: Immediate cancellation
    // In production, subscriptionStatus would stay 'premium' until subscriptionEndsAt
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'free', // DEMO: immediate downgrade
        cancelledAt: now,            // Track when user clicked cancel
        // subscriptionEndsAt: keep the date (user has premium until this date in production)
        // In production: subscriptionStatus stays 'premium', just cancel auto-renewal
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      demo: true,
      user: {
        id: updatedUser.id,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionEndsAt: updatedUser.subscriptionEndsAt,
        cancelledAt: updatedUser.cancelledAt,
      },
      billingInfo: {
        cancelledAt: now,
        accessUntil: now, // DEMO: immediate cancellation
        daysRemaining: 0,  // DEMO: no days remaining
      },
      note: {
        demo: 'Demo mode: Immediate cancellation. Premium access ended immediately.',
        production: `In production, you would keep premium until ${billingPeriodEnd.toLocaleDateString()}`
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
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

    if (!user.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active Stripe subscription' }, { status: 400 })
    }

    // Cancel Stripe subscription at period end (user keeps access)
    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: true
      }
    )

    // Update database - keep status as 'premium' until period ends
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // subscriptionStatus stays 'premium'
        // subscriptionEndsAt stays the same (from Stripe)
        // Webhook will change status to 'free' when period actually ends
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled',
      accessUntil: subscription.current_period_end,
      note: `You'll keep premium access until ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`
    }, { status: 200 })

  } catch (error) {
    console.error('Stripe cancellation error:', error)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}

// Stripe webhook will handle the actual status change when period ends:
// Event: customer.subscription.deleted
// Action: Update user.subscriptionStatus to 'free'
*/