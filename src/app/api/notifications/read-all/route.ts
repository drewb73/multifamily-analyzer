// File Location: src/app/api/notifications/read-all/route.ts
// API endpoint to mark all notifications as read

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // 2. Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Mark all unread notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        status: 'unread',
      },
      data: {
        status: 'read',
        readAt: new Date(),
      },
    });

    // 4. Return success
    return NextResponse.json({
      success: true,
      message: `Marked ${result.count} notification${result.count !== 1 ? 's' : ''} as read`,
      markedCount: result.count,
      unreadCount: 0, // All are now read
    });

  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read. Please try again.' },
      { status: 500 }
    );
  }
}