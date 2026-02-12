// File Location: src/app/api/team/members/[id]/route.ts
// API endpoint to remove a team member (workspace owner only)

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

    // 2. Get team member ID from params
    const teamMemberId = params.id;

    // 3. Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
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

    // 4. Check if user is a workspace owner
    if (user.isTeamMember) {
      return NextResponse.json(
        { error: 'Only workspace owners can remove team members' },
        { status: 403 }
      );
    }

    // 5. Get team member record
    const teamMember = await prisma.workspaceTeamMember.findUnique({
      where: { id: teamMemberId },
      include: {
        member: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // 6. Verify the team member belongs to this owner
    if (teamMember.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'You can only remove members from your own workspace' },
        { status: 403 }
      );
    }

    // 7. Remove team member - Use transaction
    await prisma.$transaction(async (tx) => {
      // Delete the team member record
      await tx.workspaceTeamMember.delete({
        where: { id: teamMemberId },
      });

      // Update the member's user record
      await tx.user.update({
        where: { id: teamMember.memberId },
        data: {
          isTeamMember: false,
          teamWorkspaceOwnerId: null,
        },
      });

      // Free up the seat (if not admin)
      if (!user.isAdmin) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            usedSeats: user.usedSeats - 1,
            availableSeats: user.availableSeats + 1,
          },
        });
      }

      // Create notification for the removed member
      await tx.notification.create({
        data: {
          userId: teamMember.memberId,
          type: 'member_removed',
          title: 'Removed from Workspace',
          message: `You have been removed from ${user.firstName} ${user.lastName}'s workspace.`,
          metadata: {
            ownerName: `${user.firstName} ${user.lastName}`,
            ownerEmail: user.email,
          },
        },
      });
    });

    // 8. Return success response
    return NextResponse.json({
      success: true,
      message: `${teamMember.memberName} has been removed from your workspace.`,
      member: {
        id: teamMember.id,
        email: teamMember.memberEmail,
        name: teamMember.memberName,
      },
    });

  } catch (error: any) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member. Please try again.' },
      { status: 500 }
    );
  }
}