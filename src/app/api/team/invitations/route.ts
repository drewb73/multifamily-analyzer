// File Location: src/app/api/team/invitations/route.ts
// API endpoint to list all team invitations (sent by owner)

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // 1. Authenticate the user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Get all invitations sent by this user
    const invitations = await prisma.workspaceInvitation.findMany({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
        invitedEmail: true,
        invitedFirstName: true,
        invitedLastName: true,
        inviteToken: true,
        status: true,
        invitationType: true,
        sentAt: true,
        expiresAt: true,
        respondedAt: true,
        invitedUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    // 4. Format invitations for response
    const formattedInvitations = invitations.map((inv) => ({
      id: inv.id,
      email: inv.invitedEmail,
      firstName: inv.invitedFirstName,
      lastName: inv.invitedLastName,
      name: `${inv.invitedFirstName} ${inv.invitedLastName}`,
      status: inv.status,
      type: inv.invitationType,
      sentAt: inv.sentAt,
      expiresAt: inv.expiresAt,
      respondedAt: inv.respondedAt,
      isExpired: new Date() > inv.expiresAt,
      daysRemaining: Math.max(
        0,
        Math.ceil((inv.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      ),
    }));

    // 5. Categorize invitations
    const pending = formattedInvitations.filter(
      (inv) => inv.status === 'pending' || inv.status === 'pending_signup' || inv.status === 'pending_premium_cancel'
    );
    const accepted = formattedInvitations.filter((inv) => inv.status === 'accepted');
    const declined = formattedInvitations.filter((inv) => inv.status === 'declined');
    const expired = formattedInvitations.filter((inv) => inv.status === 'expired');
    const rescinded = formattedInvitations.filter((inv) => inv.status === 'rescinded');

    // 6. Return invitations
    return NextResponse.json({
      success: true,
      invitations: formattedInvitations,
      summary: {
        total: formattedInvitations.length,
        pending: pending.length,
        accepted: accepted.length,
        declined: declined.length,
        expired: expired.length,
        rescinded: rescinded.length,
      },
      categorized: {
        pending,
        accepted,
        declined,
        expired,
        rescinded,
      },
    });

  } catch (error: any) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations. Please try again.' },
      { status: 500 }
    );
  }
}