// File Location: src/app/api/team/invitations/[id]/rescind/route.ts
// API endpoint to rescind (cancel) a team invitation (owner only)

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

    // 2. Get invitation ID from params
    const invitationId = params.id;

    // 3. Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        isAdmin: true,
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

    // 4. Get invitation
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
      select: {
        id: true,
        ownerId: true,
        invitedEmail: true,
        invitedFirstName: true,
        invitedLastName: true,
        invitedUserId: true,
        status: true,
        invitationType: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // 5. Validate user is the owner of this invitation
    if (invitation.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'You can only cancel your own invitations' },
        { status: 403 }
      );
    }

    // 6. Check if invitation can be rescinded
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'Cannot cancel an accepted invitation. Remove the team member instead.' },
        { status: 400 }
      );
    }

    if (invitation.status === 'rescinded') {
      return NextResponse.json(
        { error: 'This invitation has already been cancelled' },
        { status: 400 }
      );
    }

    // 7. Rescind invitation - Use transaction
    await prisma.$transaction(async (tx) => {
      // Update invitation status
      await tx.workspaceInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'rescinded',
          respondedAt: new Date(),
        },
      });

      // Free up the seat (if not admin and invitation was pending)
      if (!user.isAdmin && (invitation.status === 'pending' || invitation.status === 'pending_signup' || invitation.status === 'pending_premium_cancel')) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            usedSeats: user.usedSeats - 1,
            availableSeats: user.availableSeats + 1,
          },
        });
      }

      // If invited user exists, create notification
      if (invitation.invitedUserId) {
        await tx.notification.create({
          data: {
            userId: invitation.invitedUserId,
            type: 'invitation_rescinded',
            title: 'Team Invitation Cancelled',
            message: 'The workspace invitation you received has been cancelled.',
            metadata: {
              invitationId: invitation.id,
            },
          },
        });
      }
    });

    // 8. Return success response
    return NextResponse.json({
      success: true,
      message: `Invitation to ${invitation.invitedEmail} has been cancelled.`,
    });

  } catch (error: any) {
    console.error('Error rescinding invitation:', error);
    return NextResponse.json(
      { error: 'Failed to cancel invitation. Please try again.' },
      { status: 500 }
    );
  }
}