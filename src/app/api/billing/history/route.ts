// FILE LOCATION: /src/app/api/billing/history/route.ts
// PURPOSE: Fetch billing history from Stripe for the current user

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        stripeCustomerId: true,
        subscriptionStatus: true,
        subscriptionSource: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const billingHistory = []

    // ✅ CASE 1: User has Stripe integration
    if (user.stripeCustomerId && user.subscriptionSource === 'stripe') {
      try {
        // Fetch invoices from Stripe
        const invoices = await stripe.invoices.list({
          customer: user.stripeCustomerId,
          limit: 100, // Last 100 invoices
        })

        // Transform Stripe invoices to our format
        for (const invoice of invoices.data) {
          billingHistory.push({
            id: invoice.id,
            date: new Date(invoice.created * 1000),
            amount: invoice.amount_paid / 100, // Convert cents to dollars
            status: invoice.status === 'paid' ? 'paid' : invoice.status === 'open' ? 'pending' : 'failed',
            description: invoice.description || `Premium Subscription - ${new Date(invoice.created * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
            invoiceUrl: invoice.hosted_invoice_url, // ✅ NEW: Stripe-hosted receipt URL
            pdfUrl: invoice.invoice_pdf, // ✅ NEW: Direct PDF download
          })
        }
      } catch (stripeError) {
        console.error('Stripe invoice fetch error:', stripeError)
        // Continue - we'll add manual entry below if needed
      }
    }

    // ✅ CASE 2: Manual premium user (admin granted) - Add $0.00 entry
    if (user.subscriptionSource === 'manual' && user.subscriptionStatus === 'premium') {
      billingHistory.push({
        id: `manual-${user.createdAt.getTime()}`,
        date: user.createdAt,
        amount: 0,
        status: 'paid',
        description: 'Premium Access - Admin Granted',
        invoiceUrl: null,
        pdfUrl: null,
        isManual: true, // ✅ Flag to style differently
      })
    }

    // ✅ CASE 3: Discount code user - Add special entry
    if (user.subscriptionSource === 'discount_code' && user.subscriptionStatus === 'premium') {
      billingHistory.push({
        id: `discount-${user.createdAt.getTime()}`,
        date: user.createdAt,
        amount: 0,
        status: 'paid',
        description: 'Premium Access - Promotional Discount',
        invoiceUrl: null,
        pdfUrl: null,
        isManual: true,
      })
    }

    // Sort by date, newest first
    billingHistory.sort((a, b) => b.date.getTime() - a.date.getTime())

    return NextResponse.json({ 
      billingHistory,
      hasStripeIntegration: !!user.stripeCustomerId,
      subscriptionSource: user.subscriptionSource,
    })

  } catch (error) {
    console.error('Billing history fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing history' },
      { status: 500 }
    )
  }
}