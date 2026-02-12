// File Location: src/app/api/seats/add/route.ts
// API endpoint to add more seats to existing subscription

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  addSeats,
  isValidSeatQuantity,
  calculateMonthlyCost,
  getMaxSeats,
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
    const { additionalSeats } = body;

    // 3. Validate additional seats
    if (!additionalSeats || additionalSeats < 1) {
      return NextResponse.json(
        { error: 'Must add at least 1 seat' },
        { status: 400 }
      );
    }

    // 4. Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
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
    if (user.purchasedSeats === 0 || !user.seatSubscriptionItemId) {
      return NextResponse.json(
        { error: 'No existing seat subscription found. Use "Purchase Seats" first.' },
        { status: 400 }
      );
    }

    // 6. Check if new total would exceed maximum
    const newTotal = user.purchasedSeats + additionalSeats;
    const maxSeats = getMaxSeats();

    if (newTotal > maxSeats) {
      return NextResponse.json(
        { 
          error: `Cannot exceed ${maxSeats} total seats. You currently have ${user.purchasedSeats} seats.`,
          currentSeats: user.purchasedSeats,
          maxSeats: maxSeats,
        },
        { status: 400 }
      );
    }

    // 7. Add seats through Stripe
    const result = await addSeats(
      user.seatSubscriptionItemId,
      user.purchasedSeats,
      additionalSeats
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // 8. Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        purchasedSeats: newTotal,
        availableSeats: user.availableSeats + additionalSeats,
      },
      select: {
        purchasedSeats: true,
        usedSeats: true,
        availableSeats: true,
      },
    });

    // 9. Calculate new monthly cost
    const newMonthlyCost = calculateMonthlyCost(newTotal);
    const additionalMonthlyCost = calculateMonthlyCost(additionalSeats);

    // 10. Return success response
    return NextResponse.json({
      success: true,
      message: `Successfully added ${additionalSeats} seat${additionalSeats > 1 ? 's' : ''}`,
      seats: {
        purchased: updatedUser.purchasedSeats,
        used: updatedUser.usedSeats,
        available: updatedUser.availableSeats,
        monthlyCost: newMonthlyCost,
      },
      billing: {
        additionalMonthlyCost: additionalMonthlyCost,
        newTotalMonthlyCost: newMonthlyCost,
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