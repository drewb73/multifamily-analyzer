// File Location: src/app/api/seats/remove/route.ts
// API endpoint to remove unused seats - with admin support

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { removeSeats, calculateMonthlyCost } from '@/lib/stripe-seats';

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

    // 3. Validate input
    if (!seatsToRemove || typeof seatsToRemove !== 'number' || seatsToRemove < 1) {
      return NextResponse.json(
        { error: 'Valid seats to remove quantity is required' },
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

    // 5. Validate user has seats to remove
    if (user.purchasedSeats === 0) {
      return NextResponse.json(
        { error: 'You do not have any seats to remove' },
        { status: 400 }
      );
    }

    // 6. Validate not removing more than available
    if (seatsToRemove > user.availableSeats) {
      return NextResponse.json(
        { 
          error: `Cannot remove ${seatsToRemove} seats. Only ${user.availableSeats} seat${user.availableSeats !== 1 ? 's are' : ' is'} available (${user.usedSeats} in use).`,
          availableSeats: user.availableSeats,
          usedSeats: user.usedSeats,
        },
        { status: 400 }
      );
    }

    // 7. Remove seats via Stripe (or bypass for admins)
    const result = await removeSeats(
      user.id,
      user.seatSubscriptionItemId || '',
      user.purchasedSeats,
      seatsToRemove,
      user.usedSeats,
      user.isAdmin
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    const newTotal = user.purchasedSeats - seatsToRemove;

    // 8. Update user in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        purchasedSeats: newTotal,
        availableSeats: newTotal - user.usedSeats,
        // If removing all seats, clear the subscription item ID
        ...(newTotal === 0 && { seatSubscriptionItemId: null }),
      },
    });

    // 9. Calculate costs
    const newMonthlyCost = calculateMonthlyCost(newTotal, user.isAdmin);
    const savings = calculateMonthlyCost(seatsToRemove, user.isAdmin);

    // 10. Return success
    return NextResponse.json({
      success: true,
      message: user.isAdmin
        ? `Successfully removed ${seatsToRemove} seat${seatsToRemove > 1 ? 's' : ''} (Admin - Free)`
        : `Successfully removed ${seatsToRemove} seat${seatsToRemove > 1 ? 's' : ''}!`,
      seats: {
        purchased: newTotal,
        used: user.usedSeats,
        available: newTotal - user.usedSeats,
      },
      billing: {
        newMonthlyCost,
        monthlySavings: savings,
        isAdmin: user.isAdmin,
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