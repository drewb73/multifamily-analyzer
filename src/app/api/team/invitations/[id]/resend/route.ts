// File Location: src/app/api/team/invitations/[id]/resend/route.ts
// API endpoint to resend a team invitation (UPDATED with email sending)

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { sendInvitationReminderEmail } from '@/lib/email';

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
      select: {
        id: true,
        ownerId: true,
        invitedEmail: true,
        invitedFirstName: true,
        invitedLastName: true,
        invitedUserId: true,
        status: true,
        invitationType: true,
        expiresAt: true,
        sentAt: true,
        inviteToken: true,
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
        { error: 'You can only resend your own invitations' },
        { status: 403 }
      );
    }

    // 6. Check if invitation can be resent
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'Cannot resend an accepted invitation' },
        { status: 400 }
      );
    }

    if (invitation.status === 'rescinded') {
      return NextResponse.json(
        { error: 'Cannot resend a cancelled invitation' },
        { status: 400 }
      );
    }

    // 7. Check if it's too soon to resend (prevent spam)
    const timeSinceLastSent = Date.now() - invitation.sentAt.getTime();
    const minutesSinceLastSent = timeSinceLastSent / (1000 * 60);

    if (minutesSinceLastSent < 5) {
      return NextResponse.json(
        { 
          error: 'Please wait at least 5 minutes before resending an invitation',
          canResendAt: new Date(invitation.sentAt.getTime() + 5 * 60 * 1000),
        },
        { status: 429 }
      );
    }

    // 8. Generate new invite token
    const newInviteToken = nanoid(32);

    // 9. Extend expiration (7 days from now)
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // 10. Update invitation
    const updatedInvitation = await prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: {
        inviteToken: newInviteToken,
        sentAt: new Date(),
        expiresAt: newExpiresAt,
        // Reset status if it was expired
        status: invitation.status === 'expired' ? 
          (invitation.invitationType === 'new_user' ? 'pending_signup' : 'pending') 
          : invitation.status,
      },
    });

    // 11. If existing user, create new notification
    if (invitation.invitedUserId) {
      await prisma.notification.create({
        data: {
          userId: invitation.invitedUserId,
          type: invitation.invitationType === 'premium_conflict' ? 'premium_conflict' : 'team_invitation',
          title: 'Team Invitation Reminder',
          message: `${user.firstName} ${user.lastName} resent an invitation to join their workspace.`,
          metadata: {
            invitationId: invitation.id,
            ownerName: `${user.firstName} ${user.lastName}`,
            ownerEmail: user.email,
          },
        },
      });
    }

    // 12. Send reminder email
    const emailResult = await sendInvitationReminderEmail(
      {
        invitedEmail: invitation.invitedEmail,
        invitedFirstName: invitation.invitedFirstName,
        invitedLastName: invitation.invitedLastName,
        ownerFirstName: user.firstName || '',
        ownerLastName: user.lastName || '',
        ownerEmail: user.email,
        inviteToken: newInviteToken,
        expiresAt: newExpiresAt,
      },
      invitation.invitationType === 'new_user'
    );

    if (!emailResult.success) {
      console.error('Failed to send invitation reminder email:', emailResult.error);
      // Don't fail the whole request if email fails
    }

    // 13. Return success response
    return NextResponse.json({
      success: true,
      message: `Invitation resent to ${invitation.invitedEmail}`,
      invitation: {
        id: updatedInvitation.id,
        email: invitation.invitedEmail,
        name: `${invitation.invitedFirstName} ${invitation.invitedLastName}`,
        status: updatedInvitation.status,
        sentAt: updatedInvitation.sentAt,
        expiresAt: updatedInvitation.expiresAt,
      },
      emailSent: emailResult.success,
    });

  } catch (error: any) {
    console.error('Error resending invitation:', error);
    return NextResponse.json(
      { error: 'Failed to resend invitation. Please try again.' },
      { status: 500 }
    );
  }
}