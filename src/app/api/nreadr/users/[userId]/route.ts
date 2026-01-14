import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// PATCH - Update user subscription
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
    const { subscriptionStatus, premiumDuration } = body

    // Calculate dates based on new status
    let updateData: any = {
      subscriptionStatus,
      subscriptionSource: 'manual' // Always manual when set by admin
    }

    if (subscriptionStatus === 'trial') {
      // Set trial to 72 hours from now
      const trialEnd = new Date()
      trialEnd.setHours(trialEnd.getHours() + 72)
      updateData.trialEndsAt = trialEnd
      updateData.hasUsedTrial = true
    } else if (subscriptionStatus === 'premium') {
      // Set subscription based on duration (default 30 days)
      const duration = premiumDuration || 30
      const subEnd = new Date()
      
      if (duration === 9999) {
        // "Forever" - set to 100 years from now
        subEnd.setFullYear(subEnd.getFullYear() + 100)
      } else {
        subEnd.setDate(subEnd.getDate() + duration)
      }
      
      updateData.subscriptionEndsAt = subEnd
    } else if (subscriptionStatus === 'free') {
      // Clear dates
      updateData.trialEndsAt = null
      updateData.subscriptionEndsAt = null
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    // Log action
    await prisma.adminLog.create({
      data: {
        adminEmail: email,
        action: 'subscription_updated',
        details: {
          userId,
          newStatus: subscriptionStatus,
          updatedFields: updateData
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      user: updatedUser
    })
  } catch (error: any) {
    console.error('Update subscription error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to update subscription'
    }, { status: 500 })
  }
}

// DELETE - Mark user for deletion (soft delete with 60-day grace period)
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

    // Get user details before marking for deletion
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        email: true, 
        firstName: true, 
        lastName: true,
        subscriptionStatus: true,
        accountStatus: true,
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
        error: 'Cannot mark premium/enterprise account for deletion',
        code: 'PREMIUM_ACCOUNT',
        message: 'This user has an active premium or enterprise subscription. Please downgrade them to free tier first to prevent billing issues and revenue loss.',
        subscriptionStatus: userToDelete.subscriptionStatus
      }, { status: 400 })
    }

    // Check if already marked for deletion
    if (userToDelete.accountStatus === 'pending_deletion') {
      return NextResponse.json({ 
        success: false,
        error: 'User is already marked for deletion'
      }, { status: 400 })
    }

    // Mark user for deletion
    await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: 'pending_deletion',
        markedForDeletionAt: new Date(),
        deletedBy: email
      }
    })

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminEmail: email,
        action: 'user_marked_for_deletion',
        details: {
          userId,
          userEmail: userToDelete.email,
          userName: `${userToDelete.firstName || ''} ${userToDelete.lastName || ''}`.trim(),
          analysesCount: userToDelete._count.propertyAnalyses,
          markedBy: email,
          deletionDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days from now
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'User marked for deletion successfully. Account will be permanently deleted in 60 days.'
    })
  } catch (error: any) {
    console.error('Mark for deletion error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to mark user for deletion'
    }, { status: 500 })
  }
}