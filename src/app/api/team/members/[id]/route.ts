// File Location: src/app/api/team/members/[id]/route.ts
// FIXED: Transfers member's data to owner when removed + CORRECT MODEL NAMES

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const teamMemberId = params.id;

    if (!teamMemberId) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Attempting to remove team member: ${teamMemberId}`);

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

    if (user.isTeamMember) {
      return NextResponse.json(
        { error: 'Only workspace owners can remove team members' },
        { status: 403 }
      );
    }

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

    if (teamMember.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'You can only remove members from your own workspace' },
        { status: 403 }
      );
    }

    // ✅ CRITICAL FIX: Transfer all member's data to owner in transaction
    await prisma.$transaction(async (tx) => {
      console.log('📊 Starting data transfer to owner...');
      
      // ✅ FIXED: Transfer all deals from member to owner (correct model name: Deal)
      const dealsUpdated = await tx.deal.updateMany({
        where: { userId: teamMember.memberId },
        data: { userId: user.id },
      });
      console.log(`✅ Transferred ${dealsUpdated.count} deals to owner`);

      // ✅ Transfer all saved analyses from member to owner
      const analysesUpdated = await tx.propertyAnalysis.updateMany({
        where: { userId: teamMember.memberId },
        data: { userId: user.id },
      });
      console.log(`✅ Transferred ${analysesUpdated.count} analyses to owner`);

      // ✅ Transfer all groups from member to owner
      const groupsUpdated = await tx.analysisGroup.updateMany({
        where: { userId: teamMember.memberId },
        data: { userId: user.id },
      });
      console.log(`✅ Transferred ${groupsUpdated.count} groups to owner`);

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

      // Free up the seat
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
          message: `You have been removed from ${user.firstName} ${user.lastName}'s workspace. Your contributions have been transferred to the workspace owner.`,
          metadata: {
            ownerName: `${user.firstName} ${user.lastName}`,
            ownerEmail: user.email,
            dealsTransferred: dealsUpdated.count,
            analysesTransferred: analysesUpdated.count,
            groupsTransferred: groupsUpdated.count,
          },
        },
      });
      console.log('✅ Notification sent to removed member');
    });

    console.log(`✅ Successfully removed ${teamMember.memberEmail} and transferred data`);

    return NextResponse.json({
      success: true,
      message: `${teamMember.memberName} has been removed. Their contributions have been transferred to you.`,
      transferred: {
        member: {
          id: teamMember.id,
          email: teamMember.memberEmail,
          name: teamMember.memberName,
        },
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