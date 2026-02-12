// File Location: src/app/api/team/invitations/validate/route.ts
// API endpoint to validate invitation token and get invitation details

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // 1. Get token from query params
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // 2. Find invitation by token
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { inviteToken: token },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // 3. Check if invitation is valid
    const now = new Date();

    // Check if expired
    if (invitation.expiresAt < now) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // Check status
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      );
    }

    if (invitation.status === 'declined') {
      return NextResponse.json(
        { error: 'This invitation was declined' },
        { status: 400 }
      );
    }

    if (invitation.status === 'rescinded') {
      return NextResponse.json(
        { error: 'This invitation was cancelled by the workspace owner' },
        { status: 400 }
      );
    }

    // 4. Return invitation details
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.invitedEmail,
        firstName: invitation.invitedFirstName,
        lastName: invitation.invitedLastName,
        ownerName: `${invitation.owner.firstName} ${invitation.owner.lastName}`,
        ownerEmail: invitation.owner.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    });

  } catch (error: any) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to validate invitation. Please try again.' },
      { status: 500 }
    );
  }
}