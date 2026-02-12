// File Location: src/app/api/team/members/route.ts
// API endpoint to list all team members (workspace owner only)

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
        email: true,
        firstName: true,
        lastName: true,
        purchasedSeats: true,
        usedSeats: true,
        availableSeats: true,
        isTeamMember: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Check if user is a workspace owner (not a team member)
    if (user.isTeamMember) {
      return NextResponse.json(
        { error: 'Only workspace owners can view team members' },
        { status: 403 }
      );
    }

    // 4. Get all team members for this workspace owner
    const teamMembers = await prisma.workspaceTeamMember.findMany({
      where: {
        ownerId: user.id,
      },
      include: {
        member: {
          select: {
            id: true,
            clerkId: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    // 5. Format team members for response
    const formattedMembers = teamMembers.map((tm) => ({
      id: tm.id,
      memberId: tm.memberId,
      memberClerkId: tm.member?.clerkId,
      email: tm.memberEmail,
      name: tm.memberName,
      firstName: tm.member?.firstName,
      lastName: tm.member?.lastName,
      imageUrl: tm.member?.imageUrl,
      status: tm.status,
      role: tm.role,
      joinedAt: tm.joinedAt,
      lastLoginAt: tm.member?.lastLoginAt,
      daysSinceJoined: Math.floor(
        (Date.now() - tm.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    // 6. Get workspace statistics
    const activeMembers = formattedMembers.filter(
      (m) => m.status === 'active'
    ).length;
    const inactiveMembers = formattedMembers.filter(
      (m) => m.status === 'inactive'
    ).length;

    // 7. Return team members and stats
    return NextResponse.json({
      success: true,
      members: formattedMembers,
      workspace: {
        owner: {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        },
        seats: {
          purchased: user.purchasedSeats,
          used: user.usedSeats,
          available: user.availableSeats,
        },
        stats: {
          totalMembers: formattedMembers.length,
          activeMembers,
          inactiveMembers,
        },
      },
    });

  } catch (error: any) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members. Please try again.' },
      { status: 500 }
    );
  }
}