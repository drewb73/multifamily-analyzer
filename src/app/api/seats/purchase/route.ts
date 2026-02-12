// File Location: src/app/api/seats/purchase/route.ts
// API endpoint to purchase seats (first time) - with admin support

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { purchaseSeats, canPurchaseSeats, calculateMonthlyCost } from '@/lib/stripe-seats';

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get request body
    const body = await request.json();
    const { quantity } = body;

    // 3. Validate input
    if (!quantity || typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      );
    }

    // 4. Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        isAdmin: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        purchasedSeats: true,
        seatSubscriptionItemId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 5. Check if already purchased seats
    if (user.purchasedSeats > 0) {
      return NextResponse.json(
        { 
          error: 'You have already purchased seats. Use the "Add More Seats" option instead.',
          currentSeats: user.purchasedSeats,
        },
        { status: 400 }
      );
    }

    // 6. Check if user can purchase seats
    const canPurchase = await canPurchaseSeats(user.subscriptionStatus, user.isAdmin);
    
    if (!canPurchase.allowed) {
      return NextResponse.json(
        { error: canPurchase.reason },
        { status: 403 }
      );
    }

    // 7. Purchase seats via Stripe (or bypass for admins)
    const result = await purchaseSeats(
      user.id,
      user.stripeCustomerId,
      user.stripeSubscriptionId,
      quantity,
      user.isAdmin
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // 8. Update user in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        purchasedSeats: quantity,
        usedSeats: 0,
        availableSeats: quantity,
        seatSubscriptionItemId: result.subscriptionItemId,
      },
    });

    // 9. Calculate cost
    const monthlyCost = calculateMonthlyCost(quantity, user.isAdmin);

    // 10. Return success
    return NextResponse.json({
      success: true,
      message: user.isAdmin
        ? `Successfully purchased ${quantity} seat${quantity > 1 ? 's' : ''} (Admin - Free)`
        : `Successfully purchased ${quantity} seat${quantity > 1 ? 's' : ''}!`,
      seats: {
        purchased: quantity,
        used: 0,
        available: quantity,
      },
      billing: {
        monthlyCost,
        pricePerSeat: user.isAdmin ? 0 : 9.99,
        isAdmin: user.isAdmin,
      },
    });

  } catch (error: any) {
    console.error('Error purchasing seats:', error);
    return NextResponse.json(
      { error: 'Failed to purchase seats. Please try again.' },
      { status: 500 }
    );
  }
}