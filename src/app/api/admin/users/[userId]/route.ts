import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// PATCH - Update user information
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
    const { firstName, lastName, email: newEmail, company } = body

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email: newEmail,
        company
      }
    })

    // Log action
    await prisma.adminLog.create({
      data: {
        adminEmail: email,
        action: 'user_updated',
        details: {
          userId,
          changes: { firstName, lastName, email: newEmail, company }
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      user: updatedUser
    })
  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to update user'
    }, { status: 500 })
  }
}

// DELETE - Delete user account
export async function DELETE(
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
    const { adminPin } = body

    // Verify admin PIN
    const correctPin = process.env.ADMIN_PIN

    if (!correctPin || adminPin !== correctPin) {
      // Add delay to prevent brute force
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return NextResponse.json({ 
        success: false,
        error: 'Invalid admin PIN'
      }, { status: 401 })
    }

    // Get user details before deletion for logging
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true }
    })

    // Delete user (cascade will delete related records)
    await prisma.user.delete({
      where: { id: userId }
    })

    // Log action
    await prisma.adminLog.create({
      data: {
        adminEmail: email,
        action: 'user_deleted',
        details: {
          userId,
          userEmail: userToDelete?.email,
          userName: `${userToDelete?.firstName || ''} ${userToDelete?.lastName || ''}`.trim()
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to delete user'
    }, { status: 500 })
  }
}