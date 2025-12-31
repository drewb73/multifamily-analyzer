// src/app/api/user/profile/route.ts
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
    
    // Return user profile
    return NextResponse.json({
      displayName: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : (user.firstName || ''),
      email: user.email || '',
      company: (user as any).company || '',
      subscriptionStatus: user.subscriptionStatus || 'free',
      trialEndsAt: user.trialEndsAt,
      subscriptionEndsAt: user.subscriptionEndsAt, // ✅ FIXED - was subscriptionDate
      billingHistory: [] // Will be populated after Stripe integration
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
    
    // Check if email is already in use by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          clerkId: { not: userId }
        }
      })
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        )
      }
    }
    
    // Parse displayName into firstName and lastName
    const nameParts = displayName?.trim().split(' ') || []
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    
    // Prepare update data
    const updateData: any = {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: email || undefined,
    }
    
    // Add company if provided (only if field exists in schema)
    if (company !== undefined) {
      updateData.company = company
    }
    
    // Update user profile
    const updatedUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: updateData,
      create: {
        clerkId: userId,
        email: email || '',
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        ...(company !== undefined && { company }),
        subscriptionStatus: 'free',
        hasUsedTrial: false,
      }
    })
    
    return NextResponse.json({
      success: true,
      displayName: updatedUser.firstName && updatedUser.lastName
        ? `${updatedUser.firstName} ${updatedUser.lastName}`
        : (updatedUser.firstName || ''),
      email: updatedUser.email,
      company: (updatedUser as any).company || ''
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}