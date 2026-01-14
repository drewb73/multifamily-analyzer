// FILE 3 of 12
// Location: src/app/api/admin/banners/route.ts
// CREATE NEW FILE

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET - List all banners
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { isAdmin: true, email: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get all banners
    const banners = await prisma.banner.findMany({
      orderBy: [
        { targetAudience: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ success: true, banners })
  } catch (error) {
    console.error('Get banners error:', error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}

// POST - Create new banner
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { isAdmin: true, email: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { message, type, targetAudience, durationDays } = body

    if (!message || !type || !targetAudience) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate end date
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + (durationDays || 7))

    // Create banner
    const banner = await prisma.banner.create({
      data: {
        message,
        type,
        targetAudience,
        durationDays: durationDays || 7,
        isActive: true,
        startDate,
        endDate,
        createdBy: user.email || 'unknown'
      }
    })

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminEmail: user.email || 'unknown',
        action: 'banner_created',
        details: {
          bannerId: banner.id,
          targetAudience,
          message
        }
      }
    })

    return NextResponse.json({ success: true, banner })
  } catch (error) {
    console.error('Create banner error:', error)
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
}