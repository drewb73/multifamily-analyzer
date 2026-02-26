// FILE LOCATION: /src/app/api/user/profile/route.ts
// COMPLETE FILE - Replace entire file
// FIXED: Now returns subscriptionSource so billing can show manual premium correctly

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
      subscriptionSource: user.subscriptionSource || null,  // ✅ ADDED: Return subscription source (stripe/manual)
      trialEndsAt: user.trialEndsAt,
      subscriptionEndsAt: user.subscriptionEndsAt,
      cancelledAt: user.cancelledAt,
      hasUsedTrial: user.hasUsedTrial,
      isTeamMember: user.isTeamMember || false,
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

    // Find user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    // Parse display name into firstName and lastName
    if (displayName !== undefined) {
      const parts = displayName.trim().split(' ')
      if (parts.length === 1) {
        updateData.firstName = parts[0]
        updateData.lastName = null
      } else {
        updateData.firstName = parts[0]
        updateData.lastName = parts.slice(1).join(' ')
      }
    }
    
    if (email !== undefined) updateData.email = email
    if (company !== undefined) updateData.company = company

    // Update user
    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: updateData
    })

    return NextResponse.json({
      displayName: updatedUser.firstName && updatedUser.lastName 
        ? `${updatedUser.firstName} ${updatedUser.lastName}` 
        : (updatedUser.firstName || ''),
      email: updatedUser.email || '',
      company: (updatedUser as any).company || '',
      subscriptionStatus: updatedUser.subscriptionStatus || 'free',
      subscriptionSource: updatedUser.subscriptionSource || null,  // ✅ ADDED: Return subscription source
      trialEndsAt: updatedUser.trialEndsAt,
      subscriptionEndsAt: updatedUser.subscriptionEndsAt,
      cancelledAt: updatedUser.cancelledAt,
      hasUsedTrial: updatedUser.hasUsedTrial,
      isTeamMember: updatedUser.isTeamMember || false,
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}