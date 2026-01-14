// src/app/api/subscription/cancel/route.ts
// FIX 4: Cancel subscription but keep access until period end
import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    // FIX 4: Cancel at period end in Stripe (keeps access until then)
    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: true
      }
    )

    // Mark as cancelled but keep premium status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        cancelledAt: new Date(),
        // DON'T change subscriptionStatus - keep as 'premium'
        // DON'T change subscriptionEndsAt - already set to period end
      }
    })

    // Log cancellation
    await prisma.adminLog.create({
      data: {
        adminEmail: 'system-cancellation',
        action: 'subscription_cancelled',
        details: {
          userId: user.id,
          userEmail: user.email,
          subscriptionId: user.stripeSubscriptionId,
          cancelledAt: new Date().toISOString(),
          accessUntil: user.subscriptionEndsAt?.toISOString() || 'unknown',
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      message: user.subscriptionEndsAt 
        ? `Subscription cancelled. You will have access until ${user.subscriptionEndsAt.toLocaleDateString()}`
        : 'Subscription cancelled. You will have access until the end of your billing period.'
    })
  } catch (error: any) {
    console.error('Cancellation error:', error)
    return NextResponse.json({ 
      error: 'Failed to cancel subscription',
      details: error.message 
    }, { status: 500 })
  }
}