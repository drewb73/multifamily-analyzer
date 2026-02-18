// FILE LOCATION: /src/app/api/user/profile/route.ts
// Updated to return isTeamMember for client-side access control

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find or create user profile
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })
    
    if (!user) {
      // Create default user profile
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: '',
          subscriptionStatus: 'free',
          hasUsedTrial: false,
        }
      })
    }
    
    // Return user profile with team member status
    return NextResponse.json({
      displayName: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : (user.firstName || ''),
      email: user.email || '',
      company: (user as any).company || '',
      subscriptionStatus: user.subscriptionStatus || 'free',
      trialEndsAt: user.trialEndsAt,
      subscriptionEndsAt: user.subscriptionEndsAt,
      cancelledAt: user.cancelledAt,
      hasUsedTrial: user.hasUsedTrial,
      isTeamMember: user.isTeamMember || false,  // ✅ NEW: Return team member status
      billingHistory: []
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { displayName, email, company } = body
    
    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Parse display name into first and last name
    let firstName = ''
    let lastName = ''
    if (displayName) {
      const parts = displayName.trim().split(' ')
      firstName = parts[0] || ''
      lastName = parts.slice(1).join(' ') || ''
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      // Create new user with default values
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: email || '',
          firstName,
          lastName,
          ...(company !== undefined && { company }),
          subscriptionStatus: 'free',
          hasUsedTrial: false,
        }
      })
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { clerkId: userId },
        data: {
          ...(email !== undefined && { email }),
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(company !== undefined && { company }),
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      displayName: user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : (user.firstName || ''),
      email: user.email,
      company: (user as any).company || ''
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}