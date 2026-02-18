// File Location: src/app/api/team/members/[id]/route.ts
// API endpoint to remove a team member - Next.js 15 + seat fix

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
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

    // 2. Get team member ID from params (await for Next.js 15)
    const params = await context.params;
    const teamMemberId = params.id;

    if (!teamMemberId) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Attempting to remove team member: ${teamMemberId}`);

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
        purchasedSeats: true,
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

    console.log(`👤 Found team member: ${teamMember.memberEmail}`);

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

      console.log('✅ Team member record deleted');

      // Update the member's user record
      await tx.user.update({
        where: { id: teamMember.memberId },
        data: {
          isTeamMember: false,
          teamWorkspaceOwnerId: null,
        },
      });

      console.log('✅ Member user record updated');

      // Free up the seat (always - removed isAdmin check)
      await tx.user.update({
        where: { id: user.id },
        data: {
          usedSeats: Math.max(0, user.usedSeats - 1),
          availableSeats: Math.min(user.purchasedSeats, user.availableSeats + 1),
        },
      });

      console.log(`✅ Seat freed: usedSeats ${user.usedSeats} -> ${user.usedSeats - 1}`);

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

      console.log('✅ Notification sent to removed member');
    });

    console.log(`✅ Successfully removed ${teamMember.memberEmail} from workspace`);

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
    console.error('❌ Error removing team member:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to remove team member. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}