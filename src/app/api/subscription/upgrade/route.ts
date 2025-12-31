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
 * Demo mode: Instant upgrade without payment
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

    // DEMO MODE: Instant upgrade (no payment)
    // TODO: Add Stripe checkout flow here
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'premium',
        subscriptionEndsAt: null, // Null means active/recurring
        // Future: Add stripeCustomerId and stripeSubscriptionId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully upgraded to Premium!',
      user: {
        id: updatedUser.id,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionEndsAt: updatedUser.subscriptionEndsAt,
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Upgrade error:', error)
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    )
  }
}