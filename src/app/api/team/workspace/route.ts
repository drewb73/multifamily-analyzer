// File Location: src/app/api/team/workspace/route.ts
// API endpoint to get workspace information (for team members and owners)

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
        isTeamMember: true,
        teamWorkspaceOwnerId: true,
        purchasedSeats: true,
        usedSeats: true,
        availableSeats: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Check if user is a team member
    if (user.isTeamMember && user.teamWorkspaceOwnerId) {
      // User is a team member - get their workspace info
      const teamMember = await prisma.workspaceTeamMember.findFirst({
        where: {
          memberId: user.id,
          ownerId: user.teamWorkspaceOwnerId,
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              company: true,
              imageUrl: true,
              purchasedSeats: true,
              usedSeats: true,
            },
          },
        },
      });

      if (!teamMember) {
        return NextResponse.json(
          { error: 'Team member record not found' },
          { status: 404 }
        );
      }

      // Get all team members (excluding self)
      const allMembers = await prisma.workspaceTeamMember.findMany({
        where: {
          ownerId: user.teamWorkspaceOwnerId,
        },
        include: {
          member: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
        },
        orderBy: {
          joinedAt: 'desc',
        },
      });

      return NextResponse.json({
        success: true,
        role: 'member',
        workspace: {
          owner: {
            id: teamMember.owner.id,
            email: teamMember.owner.email,
            name: `${teamMember.owner.firstName} ${teamMember.owner.lastName}`,
            company: teamMember.owner.company,
            imageUrl: teamMember.owner.imageUrl,
          },
          seats: {
            purchased: teamMember.owner.purchasedSeats,
            used: teamMember.owner.usedSeats,
          },
          teamSize: allMembers.length,
        },
        membership: {
          status: teamMember.status,
          role: teamMember.role,
          joinedAt: teamMember.joinedAt,
          daysSinceJoined: Math.floor(
            (Date.now() - teamMember.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
          ),
        },
        teamMembers: allMembers.map((tm) => ({
          id: tm.id,
          email: tm.memberEmail,
          name: tm.memberName,
          imageUrl: tm.member?.imageUrl,
          role: tm.role,
          joinedAt: tm.joinedAt,
          isCurrentUser: tm.memberId === user.id,
        })),
      });

    } else {
      // User is a workspace owner - get their workspace info
      const teamMembers = await prisma.workspaceTeamMember.findMany({
        where: {
          ownerId: user.id,
        },
        include: {
          member: {
            select: {
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

      // Get pending invitations
      const pendingInvitations = await prisma.workspaceInvitation.findMany({
        where: {
          ownerId: user.id,
          status: {
            in: ['pending', 'pending_signup', 'pending_premium_cancel'],
          },
        },
        select: {
          id: true,
          invitedEmail: true,
          invitedFirstName: true,
          invitedLastName: true,
          status: true,
          sentAt: true,
          expiresAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        role: 'owner',
        workspace: {
          owner: {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
          },
          seats: {
            purchased: user.purchasedSeats,
            used: user.usedSeats,
            available: user.availableSeats,
          },
          teamSize: teamMembers.length,
        },
        teamMembers: teamMembers.map((tm) => ({
          id: tm.id,
          email: tm.memberEmail,
          name: tm.memberName,
          imageUrl: tm.member?.imageUrl,
          status: tm.status,
          role: tm.role,
          joinedAt: tm.joinedAt,
          lastLoginAt: tm.member?.lastLoginAt,
        })),
        pendingInvitations: pendingInvitations.map((inv) => ({
          id: inv.id,
          email: inv.invitedEmail,
          name: `${inv.invitedFirstName} ${inv.invitedLastName}`,
          status: inv.status,
          sentAt: inv.sentAt,
          expiresAt: inv.expiresAt,
          daysRemaining: Math.max(
            0,
            Math.ceil((inv.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          ),
        })),
      });
    }

  } catch (error: any) {
    console.error('Error fetching workspace info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace information. Please try again.' },
      { status: 500 }
    );
  }
}