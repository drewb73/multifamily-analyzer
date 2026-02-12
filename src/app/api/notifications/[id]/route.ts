// File Location: src/app/api/notifications/[id]/route.ts
// API endpoint to delete a notification

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate the user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get notification ID from params
    const notificationId = params.id;

    // 3. Get user from database
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

    // 4. Get notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // 5. Verify notification belongs to user
    if (notification.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own notifications' },
        { status: 403 }
      );
    }

    // 6. Delete notification
    await prisma.notification.delete({
      where: { id: notificationId },
    });

    // 7. Get updated unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        status: 'unread',
      },
    });

    // 8. Return success
    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
      unreadCount,
    });

  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification. Please try again.' },
      { status: 500 }
    );
  }
}