// FILE 5 of 12
// Location: src/app/api/admin/promo-modal/route.ts
// CREATE NEW FILE

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET - Get active promo modal
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get the promo modal (there should only be one)
    const promoModal = await prisma.promoModal.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, promoModal })
  } catch (error) {
    console.error('Get promo modal error:', error)
    return NextResponse.json({ error: 'Failed to fetch promo modal' }, { status: 500 })
  }
}

// POST - Create promo modal
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
    const { title, description, discountCode, durationDays, isActive } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    // Calculate end date
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + (durationDays || 30))

    // Create promo modal
    const promoModal = await prisma.promoModal.create({
      data: {
        title,
        description,
        discountCode: discountCode || null,
        durationDays: durationDays || 30,
        isActive: isActive !== undefined ? isActive : true,
        startDate,
        endDate,
        createdBy: user.email || 'unknown'
      }
    })

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminEmail: user.email || 'unknown',
        action: 'promo_modal_created',
        details: {
          promoModalId: promoModal.id,
          title
        }
      }
    })

    return NextResponse.json({ success: true, promoModal })
  } catch (error) {
    console.error('Create promo modal error:', error)
    return NextResponse.json({ error: 'Failed to create promo modal' }, { status: 500 })
  }
}

// PATCH - Update promo modal
export async function PATCH(request: Request) {
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
    const { title, description, discountCode, durationDays, isActive } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    // Get existing promo modal
    const existing = await prisma.promoModal.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!existing) {
      return NextResponse.json({ error: 'No promo modal found' }, { status: 404 })
    }

    // Calculate new end date if duration changed
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + (durationDays || 30))

    // Update promo modal
    const promoModal = await prisma.promoModal.update({
      where: { id: existing.id },
      data: {
        title,
        description,
        discountCode: discountCode || null,
        durationDays: durationDays || 30,
        isActive: isActive !== undefined ? isActive : true,
        startDate,
        endDate,
        updatedAt: new Date()
      }
    })

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminEmail: user.email || 'unknown',
        action: 'promo_modal_updated',
        details: {
          promoModalId: promoModal.id,
          isActive
        }
      }
    })

    return NextResponse.json({ success: true, promoModal })
  } catch (error) {
    console.error('Update promo modal error:', error)
    return NextResponse.json({ error: 'Failed to update promo modal' }, { status: 500 })
  }
}