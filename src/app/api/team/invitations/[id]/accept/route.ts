// File Location: src/app/api/team/invitations/[id]/accept/route.ts
// API endpoint to accept a team invitation - Next.js 15 compatible

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    console.log(`✅ Attempting to accept invitation: ${invitationId}`);

    // 3. Get user from database (with retry for new users)
    let user = null;
    let retries = 0;
    const maxRetries = 3;

    while (!user && retries < maxRetries) {
      user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          subscriptionStatus: true,
          isTeamMember: true,
          teamWorkspaceOwnerId: true,
        },
      });

      if (!user) {
        // User not created yet (webhook might be slow), wait and retry
        console.log(`⏳ User not found, retrying (${retries + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please try refreshing the page.' },
        { status: 404 }
      );
    }

    console.log(`👤 User found: ${user.email}`);

    // 4. Get invitation
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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

    console.log(`📧 Invitation found for: ${invitation.invitedEmail}, status: ${invitation.status}`);

    // 5. Validate invitation is for this user
    if (invitation.invitedEmail.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation is not for you' },
        { status: 403 }
      );
    }

    // 6. Check invitation status
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      );
    }

    if (invitation.status === 'declined') {
      return NextResponse.json(
        { error: 'You have already declined this invitation' },
        { status: 400 }
      );
    }

    if (invitation.status === 'rescinded') {
      return NextResponse.json(
        { error: 'This invitation was cancelled by the workspace owner' },
        { status: 400 }
      );
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // 7. Check if user is already on a team
    if (user.isTeamMember && user.teamWorkspaceOwnerId !== invitation.ownerId) {
      return NextResponse.json(
        { error: 'You are already a member of another team' },
        { status: 400 }
      );
    }

    // 8. Check Premium subscription conflict (only for existing users)
    if (invitation.status !== 'pending_signup' && user.subscriptionStatus === 'premium') {
      return NextResponse.json(
        { error: 'You must cancel your Premium subscription before joining a team workspace' },
        { status: 400 }
      );
    }

    // 9. Accept invitation - Use transaction
    await prisma.$transaction(async (tx) => {
      // Update invitation status
      await tx.workspaceInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'accepted',
          respondedAt: new Date(),
          invitedUserId: user.id,
        },
      });

      console.log('✅ Invitation status updated to accepted');

      // Create team member record
      await tx.workspaceTeamMember.create({
        data: {
          ownerId: invitation.ownerId,
          memberId: user.id,
          memberEmail: user.email,
          memberName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          role: 'member',
          status: 'active',
        },
      });

      console.log('✅ Team member record created');

      // Update user to be team member (if not already set by webhook)
      await tx.user.update({
        where: { id: user.id },
        data: {
          isTeamMember: true,
          teamWorkspaceOwnerId: invitation.ownerId,
          // If user was on trial, remove trial (team members don't need it)
          subscriptionStatus: user.subscriptionStatus === 'trial' ? 'free' : user.subscriptionStatus,
          trialEndsAt: user.subscriptionStatus === 'trial' ? null : undefined,
        },
      });

      console.log('✅ User updated as team member');

      // Create notification for owner
      await tx.notification.create({
        data: {
          userId: invitation.ownerId,
          type: 'invitation_accepted',
          title: 'Team Member Joined',
          message: `${user.firstName} ${user.lastName} has accepted your invitation and joined your workspace.`,
          metadata: {
            memberEmail: user.email,
            memberName: `${user.firstName} ${user.lastName}`,
          },
        },
      });

      console.log('✅ Notification sent to owner');
    });

    console.log(`✅ Successfully accepted invitation for ${user.email}`);

    // 10. Return success
    return NextResponse.json({
      success: true,
      message: `You have joined ${invitation.owner.firstName} ${invitation.owner.lastName}'s workspace!`,
      workspace: {
        ownerName: `${invitation.owner.firstName} ${invitation.owner.lastName}`,
        ownerEmail: invitation.owner.email,
      },
    });

  } catch (error: any) {
    console.error('❌ Error accepting invitation:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to accept invitation. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}