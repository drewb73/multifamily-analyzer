// File Location: src/app/api/seats/remove/route.ts
// API endpoint to remove unused seats

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  removeSeats,
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
    const { seatsToRemove } = body;

    // 3. Validate seats to remove
    if (!seatsToRemove || seatsToRemove < 1) {
      return NextResponse.json(
        { error: 'Must remove at least 1 seat' },
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
        { error: 'No seat subscription found.' },
        { status: 400 }
      );
    }

    // 6. Check if trying to remove more seats than purchased
    if (seatsToRemove > user.purchasedSeats) {
      return NextResponse.json(
        { 
          error: `Cannot remove ${seatsToRemove} seats. You only have ${user.purchasedSeats} total seats.`,
          currentSeats: user.purchasedSeats,
        },
        { status: 400 }
      );
    }

    // 7. Check if trying to remove more seats than available
    const newTotal = user.purchasedSeats - seatsToRemove;
    if (newTotal < user.usedSeats) {
      return NextResponse.json(
        { 
          error: `Cannot remove ${seatsToRemove} seats. You have ${user.usedSeats} team members using seats. Remove team members first.`,
          purchasedSeats: user.purchasedSeats,
          usedSeats: user.usedSeats,
          availableSeats: user.availableSeats,
        },
        { status: 400 }
      );
    }

    // 8. Remove seats through Stripe
    const result = await removeSeats(
      user.seatSubscriptionItemId,
      user.purchasedSeats,
      user.usedSeats,
      seatsToRemove
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
        purchasedSeats: newTotal,
        availableSeats: user.availableSeats - seatsToRemove,
      },
      select: {
        purchasedSeats: true,
        usedSeats: true,
        availableSeats: true,
      },
    });

    // 10. Calculate new monthly cost
    const oldMonthlyCost = calculateMonthlyCost(user.purchasedSeats);
    const newMonthlyCost = calculateMonthlyCost(newTotal);
    const monthlySavings = oldMonthlyCost - newMonthlyCost;

    // 11. Return success response
    return NextResponse.json({
      success: true,
      message: `Successfully removed ${seatsToRemove} seat${seatsToRemove > 1 ? 's' : ''}`,
      seats: {
        purchased: updatedUser.purchasedSeats,
        used: updatedUser.usedSeats,
        available: updatedUser.availableSeats,
        monthlyCost: newMonthlyCost,
      },
      billing: {
        oldMonthlyCost: oldMonthlyCost,
        newMonthlyCost: newMonthlyCost,
        monthlySavings: monthlySavings,
      },
    });

  } catch (error: any) {
    console.error('Error removing seats:', error);
    return NextResponse.json(
      { error: 'Failed to remove seats. Please try again.' },
      { status: 500 }
    );
  }
}