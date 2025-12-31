// src/app/api/subscription/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/subscription/status
 * Returns current user's subscription status and details
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        trialEndsAt: true,
        hasUsedTrial: true,
        subscriptionEndsAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate trial hours remaining
    let trialHoursRemaining = 0
    let trialExpired = false
    
    if (user.subscriptionStatus === 'trial' && user.trialEndsAt) {
      const now = new Date()
      const endsAt = new Date(user.trialEndsAt)
      const diffMs = endsAt.getTime() - now.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      
      trialHoursRemaining = Math.max(0, diffHours)
      trialExpired = diffMs <= 0
    }

    // Determine if user can upgrade
    const canUpgrade = user.subscriptionStatus !== 'premium' && user.subscriptionStatus !== 'enterprise'
    
    // Determine if user can cancel
    const canCancel = user.subscriptionStatus === 'premium' || user.subscriptionStatus === 'enterprise'

    return NextResponse.json({
      subscription: {
        status: user.subscriptionStatus,
        tier: user.subscriptionTier,
        trialEndsAt: user.trialEndsAt,
        trialHoursRemaining,
        trialExpired,
        hasUsedTrial: user.hasUsedTrial,
        subscriptionEndsAt: user.subscriptionEndsAt,
        canUpgrade,
        canCancel,
        isPremium: user.subscriptionStatus === 'premium' || user.subscriptionStatus === 'enterprise',
        isTrial: user.subscriptionStatus === 'trial',
        isFree: user.subscriptionStatus === 'free',
      },
      // Only include Stripe IDs if they exist (for debugging)
      stripe: {
        hasCustomer: !!user.stripeCustomerId,
        hasSubscription: !!user.stripeSubscriptionId,
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Get subscription status error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    )
  }
}