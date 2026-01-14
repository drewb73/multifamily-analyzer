import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// PATCH - Update banner (toggle active/inactive)
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
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

    // Await params (Next.js 15)
    const { id } = await context.params

    console.log('Attempting to update banner with ID:', id)

    const body = await request.json()
    const { isActive } = body

    // Check if banner exists first
    const existingBanner = await prisma.banner.findUnique({
      where: { id }
    })

    if (!existingBanner) {
      console.log('Banner not found:', id)
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    // Update banner
    const banner = await prisma.banner.update({
      where: { id },
      data: { isActive }
    })

    console.log('Banner updated successfully:', id, 'isActive:', isActive)

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminEmail: user.email || 'unknown',
        action: 'banner_toggled',
        details: {
          bannerId: banner.id,
          isActive,
          message: banner.message
        }
      }
    })

    return NextResponse.json({ success: true, banner })
  } catch (error: any) {
    console.error('Update banner error:', error)
    return NextResponse.json({ 
      error: 'Failed to update banner',
      details: error.message 
    }, { status: 500 })
  }
}

// DELETE - Delete banner
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
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

    // Await params (Next.js 15)
    const { id } = await context.params

    console.log('Attempting to delete banner with ID:', id)

    // Check if banner exists first
    const existingBanner = await prisma.banner.findUnique({
      where: { id }
    })

    if (!existingBanner) {
      console.log('Banner not found:', id)
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    console.log('Found banner to delete:', existingBanner.message)

    // Delete banner
    await prisma.banner.delete({
      where: { id }
    })

    console.log('Banner deleted successfully:', id)

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminEmail: user.email || 'unknown',
        action: 'banner_deleted',
        details: {
          bannerId: id,
          message: existingBanner.message,
          targetAudience: existingBanner.targetAudience
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete banner error:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    })
    return NextResponse.json({ 
      error: 'Failed to delete banner',
      details: error.message 
    }, { status: 500 })
  }
}