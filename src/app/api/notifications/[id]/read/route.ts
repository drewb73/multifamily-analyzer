// File Location: src/app/api/notifications/[id]/read/route.ts
// API endpoint to mark a notification as read

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
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
        { error: 'You can only mark your own notifications as read' },
        { status: 403 }
      );
    }

    // 6. Check if already read
    if (notification.status === 'read') {
      return NextResponse.json({
        success: true,
        message: 'Notification already marked as read',
        notification: {
          id: notification.id,
          status: notification.status,
          readAt: notification.readAt,
        },
      });
    }

    // 7. Mark as read
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'read',
        readAt: new Date(),
      },
    });

    // 8. Get updated unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        status: 'unread',
      },
    });

    // 9. Return success
    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      notification: {
        id: updatedNotification.id,
        status: updatedNotification.status,
        readAt: updatedNotification.readAt,
      },
      unreadCount,
    });

  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read. Please try again.' },
      { status: 500 }
    );
  }
}