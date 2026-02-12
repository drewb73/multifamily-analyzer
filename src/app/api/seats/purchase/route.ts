// File Location: src/app/api/seats/purchase/route.ts
// API endpoint to purchase seats for the first time

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  purchaseSeats,
  canPurchaseSeats,
  isValidSeatQuantity,
  calculateMonthlyCost,
} from '@/lib/stripe-seats';

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
    const { numberOfSeats } = body;

    // 3. Validate seat quantity
    const validation = isValidSeatQuantity(numberOfSeats);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
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
        usedSeats: true,
        availableSeats: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 5. Check if user already has seats
    if (user.purchasedSeats > 0) {
      return NextResponse.json(
        { 
          error: 'You already have seats. Use the "Add Seats" option to purchase more.',
          currentSeats: user.purchasedSeats 
        },
        { status: 400 }
      );
    }

    // 6. Check if user can purchase seats
    const canPurchase = await canPurchaseSeats(
      user.subscriptionStatus,
      user.isAdmin
    );

    if (!canPurchase.canPurchase) {
      return NextResponse.json(
        { error: canPurchase.reason },
        { status: 403 }
      );
    }

    // 7. Verify Stripe customer and subscription exist
    if (!user.stripeCustomerId || !user.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Stripe customer or subscription not found. Please contact support.' },
        { status: 400 }
      );
    }

    // 8. Purchase seats through Stripe
    const result = await purchaseSeats(
      user.stripeCustomerId,
      user.stripeSubscriptionId,
      numberOfSeats
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // 9. Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        purchasedSeats: numberOfSeats,
        usedSeats: 0,
        availableSeats: numberOfSeats,
        seatSubscriptionItemId: result.subscriptionItemId,
      },
      select: {
        purchasedSeats: true,
        usedSeats: true,
        availableSeats: true,
        seatSubscriptionItemId: true,
      },
    });

    // 10. Calculate monthly cost
    const monthlyCost = calculateMonthlyCost(numberOfSeats);

    // 11. Return success response
    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${numberOfSeats} seat${numberOfSeats > 1 ? 's' : ''}`,
      seats: {
        purchased: updatedUser.purchasedSeats,
        used: updatedUser.usedSeats,
        available: updatedUser.availableSeats,
        monthlyCost: monthlyCost,
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