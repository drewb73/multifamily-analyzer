// File Location: src/app/api/team/invitations/accept-by-token/route.ts
// Fallback route: accepts invitation using token instead of ID
// Used when sign-up page can't load invitation ID (network hiccup)

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get token from query params
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Invitation token is required' }, { status: 400 });
    }

    console.log(`🔑 Attempting to accept invitation by token`);

    // 3. Get user from database (with retry for brand new users)
    let user = null;
    for (let i = 0; i < 4; i++) {
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
      if (user) break;
      console.log(`⏳ User not found yet, retry ${i + 1}/4...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please refresh and try again.' },
        { status: 404 }
      );
    }

    console.log(`👤 User found: ${user.email}`);

    // 4. Find invitation by token
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { inviteToken: token },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    console.log(`📧 Invitation found: ${invitation.invitedEmail}, status: ${invitation.status}`);

    // 5. Validate invitation belongs to this user
    if (invitation.invitedEmail.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'This invitation is not for you' }, { status: 403 });
    }

    // 6. Check status
    if (invitation.status === 'accepted') {
      // Already accepted (webhook may have handled it) - just return success
      return NextResponse.json({
        success: true,
        message: `Already joined ${invitation.owner.firstName} ${invitation.owner.lastName}'s workspace`,
      });
    }

    if (invitation.status === 'rescinded') {
      return NextResponse.json({ error: 'This invitation was cancelled' }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 400 });
    }

    // 7. Check if user is already on this team (webhook may have set this up)
    if (user.isTeamMember && user.teamWorkspaceOwnerId === invitation.ownerId) {
      // User already set up as team member by webhook, just make sure member record exists
      const existingMember = await prisma.workspaceTeamMember.findFirst({
        where: { memberId: user.id, ownerId: invitation.ownerId },
      });

      if (!existingMember) {
        // Create the missing member record
        await prisma.$transaction(async (tx) => {
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

          await tx.workspaceInvitation.update({
            where: { id: invitation.id },
            data: { status: 'accepted', respondedAt: new Date(), invitedUserId: user.id },
          });

          await tx.notification.create({
            data: {
              userId: invitation.ownerId,
              type: 'invitation_accepted',
              title: 'Team Member Joined',
              message: `${user.firstName} ${user.lastName} has joined your workspace.`,
              metadata: { memberEmail: user.email, memberName: `${user.firstName} ${user.lastName}` },
            },
          });
        });
      }

      return NextResponse.json({
        success: true,
        message: `You've joined ${invitation.owner.firstName} ${invitation.owner.lastName}'s workspace!`,
      });
    }

    // 8. Full accept flow
    await prisma.$transaction(async (tx) => {
      await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted', respondedAt: new Date(), invitedUserId: user.id },
      });

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

      await tx.user.update({
        where: { id: user.id },
        data: {
          isTeamMember: true,
          teamWorkspaceOwnerId: invitation.ownerId,
          subscriptionStatus: user.subscriptionStatus === 'trial' ? 'free' : user.subscriptionStatus,
          trialEndsAt: user.subscriptionStatus === 'trial' ? null : undefined,
        },
      });

      await tx.notification.create({
        data: {
          userId: invitation.ownerId,
          type: 'invitation_accepted',
          title: 'Team Member Joined',
          message: `${user.firstName} ${user.lastName} has accepted your invitation and joined your workspace.`,
          metadata: { memberEmail: user.email, memberName: `${user.firstName} ${user.lastName}` },
        },
      });
    });

    console.log(`✅ Successfully accepted invitation for ${user.email}`);

    return NextResponse.json({
      success: true,
      message: `You've joined ${invitation.owner.firstName} ${invitation.owner.lastName}'s workspace!`,
    });

  } catch (error: any) {
    console.error('❌ Error accepting invitation by token:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation. Please try again.' },
      { status: 500 }
    );
  }
}