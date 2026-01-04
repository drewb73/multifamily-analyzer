// FILE: src/app/api/banners/active/route.ts
// FIXED VERSION

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET - Get active banners for current user
export async function GET() {
  try {
    const { userId } = await auth()

    // Get user's subscription status to determine which banners to show
    let userType = 'all' // Default for logged-out users
    
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { 
          subscriptionStatus: true,
          isAdmin: true 
        }
      })

      if (user) {
        if (user.isAdmin) {
          userType = 'admin'
        } else if (user.subscriptionStatus === 'premium') {
          userType = 'premium'
        } else if (user.subscriptionStatus === 'free' || user.subscriptionStatus === 'trial') {
          userType = 'free_trial'
        }
      }
    }

    // Get active banners for this user type
    const now = new Date()
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          },
          {
            OR: [
              { targetAudience: 'all' },
              { targetAudience: userType }
            ]
          }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, banners })
  } catch (error) {
    console.error('Get active banners error:', error)
    return NextResponse.json({ success: true, banners: [] })
  }
}