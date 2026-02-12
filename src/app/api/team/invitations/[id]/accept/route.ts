// File Location: src/app/api/team/invitations/[id]/accept/route.ts
// API endpoint to accept a team invitation

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

    // 2. Get invitation ID from params
    const invitationId = params.id;

    // 3. Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionStatus: true,
        isTeamMember: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 4. Get invitation
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // 5. Validate invitation is for this user
    if (invitation.invitedEmail.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation is not for you' },
        { status: 403 }
      );
    }

    // 6. Check if invitation is still valid
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      );
    }

    if (invitation.status === 'declined') {
      return NextResponse.json(
        { error: 'This invitation has been declined' },
        { status: 400 }
      );
    }

    if (invitation.status === 'rescinded') {
      return NextResponse.json(
        { error: 'This invitation has been cancelled by the sender' },
        { status: 400 }
      );
    }

    if (invitation.status === 'expired' || new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // 7. Check if user is already on a team
    if (user.isTeamMember) {
      return NextResponse.json(
        { error: 'You are already a member of another team. Leave that team first.' },
        { status: 400 }
      );
    }

    // 8. Check for Premium subscription conflict
    if (invitation.invitationType === 'premium_conflict' || user.subscriptionStatus === 'premium') {
      return NextResponse.json(
        { 
          error: 'You must cancel your Premium subscription before accepting this invitation.',
          requiresAction: 'cancel_premium',
        },
        { status: 400 }
      );
    }

    // 9. Accept invitation - Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update invitation status
      await tx.workspaceInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'accepted',
          respondedAt: new Date(),
        },
      });

      // Create team member record
      const teamMember = await tx.workspaceTeamMember.create({
        data: {
          ownerId: invitation.ownerId,
          memberId: user.id,
          memberEmail: user.email,
          memberName: `${user.firstName} ${user.lastName}`,
          status: 'active',
          role: 'member',
        },
      });

      // Update user to mark as team member
      await tx.user.update({
        where: { id: user.id },
        data: {
          isTeamMember: true,
          teamWorkspaceOwnerId: invitation.ownerId,
        },
      });

      // Create notification for owner
      await tx.notification.create({
        data: {
          userId: invitation.ownerId,
          type: 'invitation_accepted',
          title: 'Team Invitation Accepted',
          message: `${user.firstName} ${user.lastName} accepted your invitation and joined your workspace.`,
          metadata: {
            memberId: user.id,
            memberName: `${user.firstName} ${user.lastName}`,
            memberEmail: user.email,
          },
        },
      });

      return teamMember;
    });

    // 10. Return success response
    return NextResponse.json({
      success: true,
      message: `You have joined ${invitation.owner.firstName} ${invitation.owner.lastName}'s workspace!`,
      workspace: {
        ownerId: invitation.ownerId,
        ownerName: `${invitation.owner.firstName} ${invitation.owner.lastName}`,
        ownerEmail: invitation.owner.email,
      },
    });

  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation. Please try again.' },
      { status: 500 }
    );
  }
}