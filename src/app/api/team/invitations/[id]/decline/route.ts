// File Location: src/app/api/team/invitations/[id]/decline/route.ts
// API endpoint to decline a team invitation

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
            isAdmin: true,
            usedSeats: true,
            availableSeats: true,
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

    // 6. Check if invitation can be declined
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'This invitation has already been accepted. Leave the team instead.' },
        { status: 400 }
      );
    }

    if (invitation.status === 'declined') {
      return NextResponse.json(
        { error: 'This invitation has already been declined' },
        { status: 400 }
      );
    }

    if (invitation.status === 'rescinded') {
      return NextResponse.json(
        { error: 'This invitation has been cancelled by the sender' },
        { status: 400 }
      );
    }

    // 7. Decline invitation - Use transaction
    await prisma.$transaction(async (tx) => {
      // Update invitation status
      await tx.workspaceInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'declined',
          respondedAt: new Date(),
        },
      });

      // Free up the seat (if not admin)
      if (!invitation.owner.isAdmin) {
        await tx.user.update({
          where: { id: invitation.ownerId },
          data: {
            usedSeats: invitation.owner.usedSeats - 1,
            availableSeats: invitation.owner.availableSeats + 1,
          },
        });
      }

      // Create notification for owner
      await tx.notification.create({
        data: {
          userId: invitation.ownerId,
          type: 'invitation_declined',
          title: 'Team Invitation Declined',
          message: `${user.firstName} ${user.lastName} declined your invitation to join the workspace.`,
          metadata: {
            invitedEmail: user.email,
            invitedName: `${user.firstName} ${user.lastName}`,
          },
        },
      });
    });

    // 8. Return success response
    return NextResponse.json({
      success: true,
      message: 'Invitation declined successfully.',
    });

  } catch (error: any) {
    console.error('Error declining invitation:', error);
    return NextResponse.json(
      { error: 'Failed to decline invitation. Please try again.' },
      { status: 500 }
    );
  }
}