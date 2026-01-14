// src/app/api/subscription/create-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    // STEP 1: Verify user is authenticated
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // STEP 2: Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionStatus: true,
        stripeCustomerId: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    // STEP 3: Check if user already has premium
    if (user.subscriptionStatus === 'premium' || user.subscriptionStatus === 'enterprise') {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      )
    }

    // STEP 4: Get price ID from request body or environment
    const body = await request.json().catch(() => ({}))
    const priceId = body.priceId || process.env.STRIPE_PREMIUM_PRICE_ID

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not provided' },
        { status: 400 }
      )
    }

    // STEP 5: Verify the price exists in Stripe
    try {
      await stripe.prices.retrieve(priceId)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      )
    }

    // STEP 6: Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      // Payment methods - ONLY credit cards
      payment_method_types: ['card'],
      
      // Customer info
      customer: user.stripeCustomerId || undefined, // Use existing customer if available
      customer_email: user.stripeCustomerId ? undefined : user.email, // Only set email if no customer ID
      
      // What they're buying
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      
      // Subscription mode
      mode: 'subscription',
      
      // Where to redirect after success/cancel
      success_url: `${process.env.NEXT_PUBLIC_URL}/pricing?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?checkout=canceled`,
      
      // Important metadata to track this purchase
      metadata: {
        userId: user.id,
        clerkId: user.clerkId,
        userEmail: user.email,
      },
      
      // Optional: Allow promotion codes
      allow_promotion_codes: true,
      
      // Billing address collection
      billing_address_collection: 'auto',
    })

    // STEP 7: Log the checkout session creation (optional but recommended)
    await prisma.adminLog.create({
      data: {
        adminEmail: 'system-checkout',
        action: 'checkout_session_created',
        details: {
          userId: user.id,
          userEmail: user.email,
          checkoutSessionId: session.id,
          priceId: priceId,
          amount: session.amount_total,
          currency: session.currency,
        }
      }
    })

    // STEP 8: Return the checkout URL
    return NextResponse.json({
      url: session.url,
      sessionId: session.id
    })

  } catch (error: any) {
    console.error('Checkout session creation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error.message 
      },
      { status: 500 }
    )
  }
}