// File Location: src/app/api/seats/add/route.ts
// API endpoint to add more seats - with admin support

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addSeats, calculateMonthlyCost, getMaxSeats } from '@/lib/stripe-seats';

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
    const { additionalSeats } = body;

    // 3. Validate input
    if (!additionalSeats || typeof additionalSeats !== 'number' || additionalSeats < 1) {
      return NextResponse.json(
        { error: 'Valid additional seats quantity is required' },
        { status: 400 }
      );
    }

    // 4. Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
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

    // 5. Check if user has purchased seats
    if (user.purchasedSeats === 0) {
      return NextResponse.json(
        { error: 'You must purchase seats first before adding more' },
        { status: 400 }
      );
    }

    // 6. Check if would exceed maximum
    const newTotal = user.purchasedSeats + additionalSeats;
    if (newTotal > getMaxSeats()) {
      return NextResponse.json(
        { 
          error: `Total seats would exceed maximum of ${getMaxSeats()}`,
          currentSeats: user.purchasedSeats,
          maxSeats: getMaxSeats(),
        },
        { status: 400 }
      );
    }

    // 7. Add seats via Stripe (or bypass for admins)
    const result = await addSeats(
      user.id,
      user.seatSubscriptionItemId || '',
      user.purchasedSeats,
      additionalSeats,
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
        purchasedSeats: newTotal,
        availableSeats: newTotal - user.usedSeats,
      },
    });

    // 9. Calculate costs
    const monthlyCost = calculateMonthlyCost(newTotal, user.isAdmin);
    const additionalCost = calculateMonthlyCost(additionalSeats, user.isAdmin);

    // 10. Return success
    return NextResponse.json({
      success: true,
      message: user.isAdmin
        ? `Successfully added ${additionalSeats} seat${additionalSeats > 1 ? 's' : ''} (Admin - Free)`
        : `Successfully added ${additionalSeats} seat${additionalSeats > 1 ? 's' : ''}!`,
      seats: {
        purchased: newTotal,
        used: user.usedSeats,
        available: newTotal - user.usedSeats,
      },
      billing: {
        newMonthlyCost: monthlyCost,
        additionalMonthlyCost: additionalCost,
        isAdmin: user.isAdmin,
      },
    });

  } catch (error: any) {
    console.error('Error adding seats:', error);
    return NextResponse.json(
      { error: 'Failed to add seats. Please try again.' },
      { status: 500 }
    );
  }
}