import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress
    
    // Verify user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email },
      select: { isAdmin: true }
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authorized'
      }, { status: 403 })
    }

    // Fetch all users with their analysis count
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        isAdmin: true,
        subscriptionStatus: true,
        stripeSubscriptionId: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        createdAt: true,
        _count: {
          select: {
            propertyAnalyses: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ 
      success: true,
      users
    })
  } catch (error) {
    console.error('Fetch users error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 })
  }
}