// src/app/api/test-stripe/route.ts
// TEMPORARY FILE - Delete after verifying Stripe setup works
import { NextResponse } from 'next/server'
import { stripe, STRIPE_PREMIUM_PRICE_ID } from '@/lib/stripe'

export async function GET() {
  try {
    // Test 1: Verify Stripe client works
    const balance = await stripe.balance.retrieve()
    
    // Test 2: Verify price exists
    const price = await stripe.prices.retrieve(STRIPE_PREMIUM_PRICE_ID)
    
    // Test 3: Get product details
    const product = await stripe.products.retrieve(price.product as string)
    
    return NextResponse.json({
      success: true,
      message: '✅ Stripe is configured correctly!',
      details: {
        stripeConnected: true,
        testMode: !balance.livemode,
        productName: product.name,
        priceAmount: `$${(price.unit_amount! / 100).toFixed(2)}`,
        priceCurrency: price.currency.toUpperCase(),
        billingPeriod: price.recurring?.interval || 'one-time',
        priceId: STRIPE_PREMIUM_PRICE_ID
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: 'Check that your STRIPE_SECRET_KEY and STRIPE_PREMIUM_PRICE_ID are correct in .env.local'
    }, { status: 500 })
  }
}