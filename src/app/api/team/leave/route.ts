// File Location: src/app/api/team/leave/route.ts
// API endpoint for team members to leave a workspace

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
        email: true,
        firstName: true,
        lastName: true,
        isTeamMember: true,
        teamWorkspaceOwnerId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Check if user is actually a team member
    if (!user.isTeamMember || !user.teamWorkspaceOwnerId) {
      return NextResponse.json(
        { error: 'You are not a member of any workspace' },
        { status: 400 }
      );
    }

    // 4. Get team member record
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
            isAdmin: true,
            usedSeats: true,
            availableSeats: true,
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

    // 5. Leave workspace - Use transaction
    await prisma.$transaction(async (tx) => {
      // Delete the team member record
      await tx.workspaceTeamMember.delete({
        where: { id: teamMember.id },
      });

      // Update user record
      await tx.user.update({
        where: { id: user.id },
        data: {
          isTeamMember: false,
          teamWorkspaceOwnerId: null,
        },
      });

      // Free up the seat (if owner is not admin)
      if (!teamMember.owner.isAdmin) {
        await tx.user.update({
          where: { id: teamMember.ownerId },
          data: {
            usedSeats: teamMember.owner.usedSeats - 1,
            availableSeats: teamMember.owner.availableSeats + 1,
          },
        });
      }

      // Create notification for the owner
      await tx.notification.create({
        data: {
          userId: teamMember.ownerId,
          type: 'member_left',
          title: 'Team Member Left',
          message: `${user.firstName} ${user.lastName} has left your workspace.`,
          metadata: {
            memberEmail: user.email,
            memberName: `${user.firstName} ${user.lastName}`,
          },
        },
      });
    });

    // 6. Return success response
    return NextResponse.json({
      success: true,
      message: `You have left ${teamMember.owner.firstName} ${teamMember.owner.lastName}'s workspace.`,
      formerWorkspace: {
        ownerName: `${teamMember.owner.firstName} ${teamMember.owner.lastName}`,
        ownerEmail: teamMember.owner.email,
      },
    });

  } catch (error: any) {
    console.error('Error leaving workspace:', error);
    return NextResponse.json(
      { error: 'Failed to leave workspace. Please try again.' },
      { status: 500 }
    );
  }
}