import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// DELETE - Nuclear delete (immediate permanent deletion for spam/bots)
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

    // Get user details before deletion
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        clerkId: true,
        email: true, 
        firstName: true, 
        lastName: true,
        subscriptionStatus: true,  // Check subscription status
        _count: {
          select: {
            propertyAnalyses: true
          }
        }
      }
    })

    if (!userToDelete) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // SAFETY CHECK: Prevent deletion of premium/enterprise accounts
    if (userToDelete.subscriptionStatus === 'premium' || userToDelete.subscriptionStatus === 'enterprise') {
      return NextResponse.json({ 
        success: false,
        error: 'Cannot delete premium/enterprise account',
        code: 'PREMIUM_ACCOUNT',
        message: 'This user has an active premium or enterprise subscription. Please downgrade them to free tier first to prevent billing issues and revenue loss.',
        subscriptionStatus: userToDelete.subscriptionStatus
      }, { status: 400 })
    }

    // NUCLEAR DELETE - Immediate and permanent

    // 1. Delete from Clerk
    try {
      const clerk = await clerkClient()
      await clerk.users.deleteUser(userToDelete.clerkId)
    } catch (clerkError: any) {
      console.error('Failed to delete user from Clerk:', clerkError)
      // Continue with database deletion even if Clerk fails
    }

    // 2. Delete from database (cascade will delete all related records)
    await prisma.user.delete({
      where: { id: userId }
    })

    // 3. Log the nuclear deletion
    await prisma.adminLog.create({
      data: {
        adminEmail: email,
        action: 'user_nuclear_deleted',
        details: {
          userId,
          userEmail: userToDelete.email,
          userName: `${userToDelete.firstName || ''} ${userToDelete.lastName || ''}`.trim(),
          clerkId: userToDelete.clerkId,
          analysesDeleted: userToDelete._count.propertyAnalyses,
          deletedBy: email,
          reason: 'Nuclear delete - spam/bot/abuse',
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'User permanently deleted from Clerk and database (nuclear delete)'
    })
  } catch (error: any) {
    console.error('Nuclear delete error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to permanently delete user'
    }, { status: 500 })
  }
}