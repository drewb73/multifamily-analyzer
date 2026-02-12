// File Location: src/app/api/team/invitations/[id]/resend/route.ts
// API endpoint to resend a team invitation - All types fixed

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { sendInvitationReminderEmail } from '@/lib/email';

export async function POST(
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

    // 2. Get invitation ID from params (await for Next.js 15)
    const params = await context.params;
    const invitationId = params.id;

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    console.log(`📧 Attempting to resend invitation: ${invitationId}`);

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
        inviteToken: true,
        sentAt: true,
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
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      );
    }

    if (invitation.status === 'declined') {
      return NextResponse.json(
        { error: 'Cannot resend a declined invitation' },
        { status: 400 }
      );
    }

    if (invitation.status === 'rescinded') {
      return NextResponse.json(
        { error: 'Cannot resend a cancelled invitation' },
        { status: 400 }
      );
    }

    // 7. Check cooldown (prevent spam) - 5 minutes
    if (invitation.sentAt) {
      const timeSinceLastSent = Date.now() - invitation.sentAt.getTime();
      const cooldownMs = 5 * 60 * 1000; // 5 minutes

      if (timeSinceLastSent < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastSent) / 1000);
        return NextResponse.json(
          { 
            error: `Please wait ${remainingSeconds} seconds before resending this invitation.`,
            cooldown: remainingSeconds,
          },
          { status: 429 }
        );
      }
    }

    // 8. Generate new token and update invitation
    const newToken = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: {
        inviteToken: newToken,
        expiresAt: expiresAt,
        sentAt: new Date(),
      },
    });

    console.log(`✅ Updated invitation with new token`);

    // 9. Send reminder email
    let emailSent = false;
    try {
      const isNewUser = invitation.invitationType === 'new_user';
      
      // ✅ FIXED: Use ownerFirstName and ownerLastName (not ownerName)
      await sendInvitationReminderEmail(
        {
          invitedEmail: invitation.invitedEmail,
          invitedFirstName: invitation.invitedFirstName,
          invitedLastName: invitation.invitedLastName,
          ownerFirstName: user.firstName || '',
          ownerLastName: user.lastName || '',
          ownerEmail: user.email,
          inviteToken: newToken,
          expiresAt: expiresAt,
        },
        isNewUser
      );
      emailSent = true;
      console.log(`✅ Reminder email sent to ${invitation.invitedEmail}`);
    } catch (emailError: any) {
      console.error('Failed to send reminder email:', emailError);
      // Don't fail the request if email fails
    }

    // 10. Return success
    return NextResponse.json({
      success: true,
      message: `Invitation reminder sent to ${invitation.invitedEmail}`,
      emailSent,
      expiresAt,
    });

  } catch (error: any) {
    console.error('❌ Error resending invitation:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to resend invitation. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}