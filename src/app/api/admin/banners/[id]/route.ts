// FILE 4 of 12
// Location: src/app/api/admin/banners/[id]/route.ts
// CREATE NEW FILE (create folder [id] first)

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// PATCH - Update banner (toggle active/inactive)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const { isActive } = body

    // Update banner
    const banner = await prisma.banner.update({
      where: { id: params.id },
      data: { isActive }
    })

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminEmail: user.email || 'unknown',
        action: 'banner_toggled',
        details: {
          bannerId: banner.id,
          isActive
        }
      }
    })

    return NextResponse.json({ success: true, banner })
  } catch (error) {
    console.error('Update banner error:', error)
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 })
  }
}

// DELETE - Delete banner
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Delete banner
    await prisma.banner.delete({
      where: { id: params.id }
    })

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminEmail: user.email || 'unknown',
        action: 'banner_deleted',
        details: {
          bannerId: params.id
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete banner error:', error)
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
  }
}