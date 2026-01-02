import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// PATCH - Toggle user admin status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params
    const body = await request.json()
    const { isAdmin } = body

    // Update user admin status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin }
    })

    // Log action
    await prisma.adminLog.create({
      data: {
        adminEmail: email,
        action: isAdmin ? 'admin_granted' : 'admin_revoked',
        details: {
          userId,
          userEmail: updatedUser.email
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      user: updatedUser
    })
  } catch (error: any) {
    console.error('Toggle admin error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to update admin status'
    }, { status: 500 })
  }
}