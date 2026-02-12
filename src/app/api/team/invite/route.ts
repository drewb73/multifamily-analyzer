// File Location: src/app/api/team/invite/route.ts
// API endpoint to invite a team member

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

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

    // 2. Get request body
    const body = await request.json();
    const { email, firstName, lastName } = body;

    // 3. Validate input
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 4. Get the workspace owner (inviter)
    const owner = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionStatus: true,
        isAdmin: true,
        purchasedSeats: true,
        usedSeats: true,
        availableSeats: true,
      },
    });

    if (!owner) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 5. Check if owner can invite (has available seats)
    // Admins bypass this check
    if (!owner.isAdmin && owner.availableSeats <= 0) {
      return NextResponse.json(
        { 
          error: 'No available seats. Purchase more seats to invite team members.',
          availableSeats: owner.availableSeats,
          purchasedSeats: owner.purchasedSeats,
          usedSeats: owner.usedSeats,
        },
        { status: 400 }
      );
    }

    // 6. Check if inviting themselves
    if (email.toLowerCase() === owner.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'You cannot invite yourself' },
        { status: 400 }
      );
    }

    // 7. Check if already invited
    const existingInvitation = await prisma.workspaceInvitation.findUnique({
      where: {
        ownerId_invitedEmail: {
          ownerId: owner.id,
          invitedEmail: email.toLowerCase(),
        },
      },
    });

    if (existingInvitation) {
      if (existingInvitation.status === 'pending' || existingInvitation.status === 'pending_signup') {
        return NextResponse.json(
          { 
            error: 'This user has already been invited and has a pending invitation.',
            invitationId: existingInvitation.id,
          },
          { status: 400 }
        );
      }

      if (existingInvitation.status === 'accepted') {
        return NextResponse.json(
          { error: 'This user is already a team member' },
          { status: 400 }
        );
      }
    }

    // 8. Check if user exists in the system
    const invitedUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        isTeamMember: true,
        teamWorkspaceOwnerId: true,
      },
    });

    let invitationType = 'new_user';
    let invitationStatus = 'pending_signup';

    if (invitedUser) {
      // User exists in system
      invitationType = 'existing_user';
      invitationStatus = 'pending';

      // Check if they're already on someone's team
      if (invitedUser.isTeamMember) {
        return NextResponse.json(
          { error: 'This user is already a member of another team' },
          { status: 400 }
        );
      }

      // Check if they have Premium subscription (conflict)
      if (invitedUser.subscriptionStatus === 'premium') {
        invitationType = 'premium_conflict';
        invitationStatus = 'pending_premium_cancel';
      }
    }

    // 9. Generate unique invite token
    const inviteToken = nanoid(32);

    // 10. Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 11. Create invitation
    const invitation = await prisma.workspaceInvitation.create({
      data: {
        ownerId: owner.id,
        invitedEmail: email.toLowerCase(),
        invitedFirstName: firstName,
        invitedLastName: lastName,
        invitedUserId: invitedUser?.id,
        inviteToken: inviteToken,
        status: invitationStatus,
        invitationType: invitationType,
        expiresAt: expiresAt,
      },
    });

    // 12. If existing user, create notification
    if (invitedUser) {
      await prisma.notification.create({
        data: {
          userId: invitedUser.id,
          type: invitationType === 'premium_conflict' ? 'premium_conflict' : 'team_invitation',
          title: invitationType === 'premium_conflict' 
            ? 'Team Invitation - Action Required'
            : 'Team Invitation',
          message: invitationType === 'premium_conflict'
            ? `${owner.firstName} ${owner.lastName} invited you to join their workspace. You must cancel your Premium subscription to accept.`
            : `${owner.firstName} ${owner.lastName} invited you to join their workspace.`,
          metadata: {
            invitationId: invitation.id,
            ownerName: `${owner.firstName} ${owner.lastName}`,
            ownerEmail: owner.email,
          },
        },
      });
    }

    // 13. Update used/available seats (mark seat as pending)
    if (!owner.isAdmin) {
      await prisma.user.update({
        where: { id: owner.id },
        data: {
          usedSeats: owner.usedSeats + 1,
          availableSeats: owner.availableSeats - 1,
        },
      });
    }

    // 14. TODO: Send invitation email (we'll implement this in CHUNK 7)
    // For now, we'll just create the invitation in the database

    // 15. Return success response
    return NextResponse.json({
      success: true,
      message: invitationType === 'new_user'
        ? `Invitation sent to ${email}. They will receive an email with signup instructions.`
        : invitationType === 'premium_conflict'
        ? `Invitation sent to ${email}. They must cancel their Premium subscription to accept.`
        : `Invitation sent to ${email}. They will be notified in-app.`,
      invitation: {
        id: invitation.id,
        email: invitation.invitedEmail,
        name: `${invitation.invitedFirstName} ${invitation.invitedLastName}`,
        status: invitation.status,
        type: invitation.invitationType,
        sentAt: invitation.sentAt,
        expiresAt: invitation.expiresAt,
      },
    });

  } catch (error: any) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation. Please try again.' },
      { status: 500 }
    );
  }
}