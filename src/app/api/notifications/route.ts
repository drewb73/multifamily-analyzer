// File Location: src/app/api/notifications/route.ts
// API endpoint to get all notifications for the current user

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Get query parameters
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status'); // 'unread', 'read', 'all'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 4. Build where clause
    const whereClause: any = {
      userId: user.id,
    };

    if (statusFilter === 'unread') {
      whereClause.status = 'unread';
    } else if (statusFilter === 'read') {
      whereClause.status = 'read';
    }
    // 'all' or no filter = no status filter

    // 5. Get notifications
    const [notifications, totalCount, unreadCount] = await Promise.all([
      // Get paginated notifications
      prisma.notification.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      // Get total count for pagination
      prisma.notification.count({
        where: whereClause,
      }),
      // Get unread count for badge
      prisma.notification.count({
        where: {
          userId: user.id,
          status: 'unread',
        },
      }),
    ]);

    // 6. Format notifications
    const formattedNotifications = notifications.map((notif) => ({
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      status: notif.status,
      metadata: notif.metadata,
      createdAt: notif.createdAt,
      readAt: notif.readAt,
      isNew: notif.createdAt > new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      timeAgo: getTimeAgo(notif.createdAt),
    }));

    // 7. Return notifications
    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      unreadCount,
    });

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications. Please try again.' },
      { status: 500 }
    );
  }
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}