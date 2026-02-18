// File Location: src/app/api/team/invitations/[id]/rescind/route.ts
// API endpoint to rescind (cancel) a team invitation (owner only) - Next.js 15 compatible

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
      console.error('Rescind invitation: No userId');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get invitation ID from params (await for Next.js 15)
    const params = await context.params;
    const invitationId = params.id;

    if (!invitationId) {
      console.error('Rescind invitation: No invitation ID');
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Attempting to rescind invitation: ${invitationId}`);

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
      console.error('Rescind invitation: User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`👤 User found: ${user.email}`);

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
      console.error('Rescind invitation: Invitation not found');
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    console.log(`📧 Invitation found for: ${invitation.invitedEmail}, status: ${invitation.status}`);

    // 5. Validate user is the owner of this invitation
    if (invitation.ownerId !== user.id) {
      console.error(`Rescind invitation: User ${user.id} is not owner ${invitation.ownerId}`);
      return NextResponse.json(
        { error: 'You can only cancel your own invitations' },
        { status: 403 }
      );
    }

    // 6. Check if invitation can be rescinded
    if (invitation.status === 'accepted') {
      console.error('Rescind invitation: Already accepted');
      return NextResponse.json(
        { error: 'Cannot cancel an accepted invitation. Remove the team member instead.' },
        { status: 400 }
      );
    }

    if (invitation.status === 'rescinded') {
      console.error('Rescind invitation: Already rescinded');
      return NextResponse.json(
        { error: 'This invitation has already been cancelled' },
        { status: 400 }
      );
    }

    // 7. Rescind invitation - Use transaction
    try {
      await prisma.$transaction(async (tx) => {
        // Update invitation status
        await tx.workspaceInvitation.update({
          where: { id: invitationId },
          data: {
            status: 'rescinded',
            respondedAt: new Date(),
          },
        });

        console.log('✅ Invitation status updated to rescinded');

        // Free up the seat whenever a pending invitation is cancelled
        const shouldFreeSeat = (
          invitation.status === 'pending' || 
          invitation.status === 'pending_signup' || 
          invitation.status === 'pending_premium_cancel'
        );

        if (shouldFreeSeat) {
          await tx.user.update({
            where: { id: user.id },
            data: {
              usedSeats: Math.max(0, user.usedSeats - 1),
              availableSeats: user.availableSeats + 1,
            },
          });

          console.log(`✅ Freed seat: usedSeats ${user.usedSeats} -> ${user.usedSeats - 1}`);
        } else {
          console.log(`ℹ️ Seat not freed (status: ${invitation.status})`);
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

          console.log(`✅ Notification sent to invited user`);
        }
      });
    } catch (txError: any) {
      console.error('Transaction error:', txError);
      throw txError;
    }

    console.log(`✅ Successfully rescinded invitation to ${invitation.invitedEmail}`);

    // 8. Return success response
    return NextResponse.json({
      success: true,
      message: `Invitation to ${invitation.invitedEmail} has been cancelled.`,
      freedSeat: true,
    });

  } catch (error: any) {
    console.error('❌ Error rescinding invitation:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to cancel invitation. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}