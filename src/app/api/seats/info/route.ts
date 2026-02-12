// File Location: src/app/api/seats/info/route.ts
// API endpoint to get seat information - with admin status

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSeatInfo, getSeatPrice, getMaxSeats } from '@/lib/stripe-seats';

export async function GET(request: Request) {
  try {
    // 1. Authenticate the user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        isAdmin: true,
        purchasedSeats: true,
        usedSeats: true,
        availableSeats: true,
        seatSubscriptionItemId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Get seat information
    const seatInfo = await getSeatInfo(
      user.purchasedSeats,
      user.usedSeats,
      user.isAdmin
    );

    // 4. Return seat information
    return NextResponse.json({
      success: true,
      ...seatInfo,
      pricing: {
        pricePerSeat: getSeatPrice(),
        maxSeats: getMaxSeats(),
      },
      subscription: {
        status: user.subscriptionStatus,
        hasStripeSubscription: !!user.seatSubscriptionItemId,
      },
      permissions: {
        canPurchaseSeats: user.subscriptionStatus === 'premium' || user.isAdmin,
        canInviteMembers: user.availableSeats > 0 || user.isAdmin,
      },
    });

  } catch (error: any) {
    console.error('Error getting seat info:', error);
    return NextResponse.json(
      { error: 'Failed to get seat information. Please try again.' },
      { status: 500 }
    );
  }
}