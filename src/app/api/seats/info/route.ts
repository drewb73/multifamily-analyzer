// File Location: src/app/api/seats/info/route.ts
// API endpoint to get current seat information

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getSeatInfo,
  getSeatPrice,
  getMaxSeats,
  canPurchaseSeats,
} from '@/lib/stripe-seats';

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

    // 3. Get seat information (convert null to undefined)
    const seatInfo = await getSeatInfo(
      user.purchasedSeats,
      user.usedSeats,
      user.seatSubscriptionItemId ?? undefined
    );

    // 4. Check if user can purchase seats
    const canPurchase = await canPurchaseSeats(
      user.subscriptionStatus,
      user.isAdmin
    );

    // 5. Get pricing info
    const seatPrice = getSeatPrice();
    const maxSeats = getMaxSeats();

    // 6. Return seat information
    return NextResponse.json({
      success: true,
      seats: {
        purchased: seatInfo.purchased,
        used: seatInfo.used,
        available: seatInfo.available,
        monthlyCost: seatInfo.monthlyCost,
      },
      pricing: {
        pricePerSeat: seatPrice,
        maxSeats: maxSeats,
      },
      permissions: {
        canPurchase: canPurchase.canPurchase,
        canPurchaseReason: canPurchase.reason,
        canAddSeats: user.purchasedSeats > 0 && user.purchasedSeats < maxSeats,
        canRemoveSeats: user.availableSeats > 0,
      },
      user: {
        subscriptionStatus: user.subscriptionStatus,
        isAdmin: user.isAdmin,
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