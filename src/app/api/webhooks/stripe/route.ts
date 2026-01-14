// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// IMPORTANT: Disable body parsing so we can verify the webhook signature
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('❌ No stripe-signature header found')
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // STEP 1: Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  console.log('✅ Webhook verified:', event.type)

  try {
    // STEP 2: Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Handle successful checkout - new subscription created
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('🎉 Checkout completed:', session.id)

  // Get user ID from metadata
  const userId = session.metadata?.userId
  if (!userId) {
    console.error('❌ No userId in session metadata')
    return
  }

  // Get subscription details
  const subscriptionId = session.subscription as string
  if (!subscriptionId) {
    console.error('❌ No subscription ID in session')
    return
  }

  // Fetch full subscription details from Stripe
  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId)
  const subscription = subscriptionResponse as Stripe.Subscription

  // Get period end timestamp
  const periodEnd = typeof subscription.current_period_end === 'number' 
    ? subscription.current_period_end 
    : Date.now() / 1000 + (30 * 24 * 60 * 60) // Default to 30 days from now

  // Update user in database
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'premium',
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscriptionId,
      subscriptionEndsAt: new Date(periodEnd * 1000),
    }
  })

  console.log('✅ User upgraded to premium:', user.email)

  // Log to AdminLog
  await prisma.adminLog.create({
    data: {
      adminEmail: 'stripe-webhook',
      action: 'subscription_created',
      details: {
        userId: user.id,
        userEmail: user.email,
        subscriptionId: subscriptionId,
        customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id || 'unknown',
        amount: session.amount_total || 0,
        currency: session.currency || 'usd',
        periodEnd: periodEnd,
      }
    }
  })

  console.log('📝 Logged subscription creation to AdminLog')
}

/**
 * Handle subscription updates (plan changes, renewals, etc.)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id)

  // Find user by Stripe subscription ID
  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  })

  if (!user) {
    console.error('❌ User not found for subscription:', subscription.id)
    return
  }

  // Determine new status based on subscription status
  let newStatus: 'premium' | 'free' = 'premium'
  
  if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    newStatus = 'free'
  }

  // Get period end timestamp
  const periodEnd = typeof subscription.current_period_end === 'number' 
    ? subscription.current_period_end 
    : Date.now() / 1000 + (30 * 24 * 60 * 60)

  // Update user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: newStatus,
      subscriptionEndsAt: new Date(periodEnd * 1000),
    }
  })

  console.log('✅ User subscription updated:', user.email, '→', newStatus)

  // Log to AdminLog
  await prisma.adminLog.create({
    data: {
      adminEmail: 'stripe-webhook',
      action: 'subscription_updated',
      details: {
        userId: user.id,
        userEmail: user.email,
        subscriptionId: subscription.id,
        status: subscription.status,
        newStatus: newStatus,
        periodEnd: periodEnd,
      }
    }
  })
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('❌ Subscription deleted:', subscription.id)

  // Find user by Stripe subscription ID
  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  })

  if (!user) {
    console.error('❌ User not found for subscription:', subscription.id)
    return
  }

  // Update user to free
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'free',
      subscriptionEndsAt: new Date(), // Ended now
    }
  })

  console.log('✅ User downgraded to free:', user.email)

  // Log to AdminLog
  await prisma.adminLog.create({
    data: {
      adminEmail: 'stripe-webhook',
      action: 'subscription_deleted',
      details: {
        userId: user.id,
        userEmail: user.email,
        subscriptionId: subscription.id,
        canceledAt: Date.now(),
      }
    }
  })
}

/**
 * Handle successful invoice payment (renewals)
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('✅ Invoice payment succeeded:', invoice.id)

  if (!invoice.subscription) {
    console.log('ℹ️ Invoice not associated with subscription')
    return
  }

  // Find user by Stripe subscription ID
  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string }
  })

  if (!user) {
    console.error('❌ User not found for subscription:', invoice.subscription)
    return
  }

  // Fetch subscription to get period end
  const subscriptionResponse = await stripe.subscriptions.retrieve(invoice.subscription as string)
  const subscription = subscriptionResponse as Stripe.Subscription

  // Get period end timestamp
  const periodEnd = typeof subscription.current_period_end === 'number' 
    ? subscription.current_period_end 
    : Date.now() / 1000 + (30 * 24 * 60 * 60)

  // Update subscription end date
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'premium',
      subscriptionEndsAt: new Date(periodEnd * 1000),
    }
  })

  console.log('✅ User subscription renewed:', user.email)

  // Log to AdminLog
  await prisma.adminLog.create({
    data: {
      adminEmail: 'stripe-webhook',
      action: 'invoice_payment_succeeded',
      details: {
        userId: user.id,
        userEmail: user.email,
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription,
        amount: invoice.amount_paid || 0,
        currency: invoice.currency || 'usd',
        periodEnd: periodEnd,
      }
    }
  })
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ Invoice payment failed:', invoice.id)

  if (!invoice.subscription) {
    console.log('ℹ️ Invoice not associated with subscription')
    return
  }

  // Find user by Stripe subscription ID
  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string }
  })

  if (!user) {
    console.error('❌ User not found for subscription:', invoice.subscription)
    return
  }

  console.log('⚠️ Payment failed for user:', user.email)

  // Log to AdminLog
  await prisma.adminLog.create({
    data: {
      adminEmail: 'stripe-webhook',
      action: 'invoice_payment_failed',
      details: {
        userId: user.id,
        userEmail: user.email,
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription,
        amount: invoice.amount_due || 0,
        currency: invoice.currency || 'usd',
        attemptCount: invoice.attempt_count || 0,
      }
    }
  })

  // Note: We don't immediately downgrade on first failure
  // Stripe will retry payment automatically
  // Only after final failure will subscription.deleted event fire
}