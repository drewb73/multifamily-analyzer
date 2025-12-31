// src/app/api/subscription/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/subscription/cancel
 * Cancels user's premium subscription
 * 
 * Demo mode: Instant cancellation
 * Future: Will cancel Stripe subscription but maintain access until period end
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

    // DEMO MODE: Instant cancellation
    // TODO: Add Stripe cancellation logic
    // In production, user keeps premium until subscriptionEndsAt
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'free',
        subscriptionEndsAt: null,
        // Future: Cancel Stripe subscription but don't remove stripeCustomerId
        // (allows easy re-subscription)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      user: {
        id: updatedUser.id,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionEndsAt: updatedUser.subscriptionEndsAt,
      },
      note: 'Demo mode: Immediate cancellation. In production, you would keep premium access until the end of your billing period.'
    }, { status: 200 })

  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}